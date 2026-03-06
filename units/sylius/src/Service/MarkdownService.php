<?php

namespace App\Service;

/**
 * Service de conversion Markdown vers HTML
 * 
 * Version simple sans dépendance externe.
 * Supporte les encadrés éditoriaux du blog Dorevia-Vault.
 */
class MarkdownService
{
    /**
     * Convertit du Markdown en HTML
     * 
     * Supporte les encadrés éditoriaux :
     * - <!-- ENCADRE:DEFINITION --> ... <!-- /ENCADRE:DEFINITION -->
     * - <!-- ENCADRE:A_RETENIR --> ... <!-- /ENCADRE:A_RETENIR -->
     * - <!-- ENCADRE:EXEMPLE --> ... <!-- /ENCADRE:EXEMPLE -->
     */
    public function toHtml(string $markdown): string
    {
        // Extraire les encadrés AVANT le traitement Markdown
        $encadres = [];
        $html = preg_replace_callback(
            '/<!-- ENCADRE:(DEFINITION|A_RETENIR|EXEMPLE) -->\s*(.*?)\s*<!-- \/ENCADRE:\1 -->/s',
            function($matches) use (&$encadres) {
                $type = strtolower(str_replace('_', '-', $matches[1]));
                $id = 'ENCADRE_' . count($encadres);
                $content = trim($matches[2]);
                
                // Traiter le contenu selon le type
                if ($type === 'a-retenir') {
                    // Extraire les points (lignes commençant par -)
                    $points = [];
                    $lines = explode("\n", $content);
                    foreach ($lines as $line) {
                        $line = trim($line);
                        if (preg_match('/^[-•]\s*(.+)$/', $line, $m)) {
                            $points[] = $m[1];
                        } elseif (!empty($line)) {
                            $points[] = $line;
                        }
                    }
                    $encadres[$id] = ['type' => $type, 'points' => $points];
                } else {
                    $encadres[$id] = ['type' => $type, 'content' => $content];
                }
                
                return '{{ ENCADRE:' . $id . ' }}';
            },
            $markdown
        );

        // Traitement Markdown standard
        $html = $this->processMarkdown($html);

        // Remplacer les placeholders par des divs avec data-attributes
        foreach ($encadres as $id => $encadre) {
            $placeholder = '{{ ENCADRE:' . $id . ' }}';
            if ($encadre['type'] === 'a-retenir') {
                $pointsJson = json_encode($encadre['points']);
                $replacement = '<div class="blog-encadre-placeholder" data-type="a-retenir" data-points=\'' . htmlspecialchars($pointsJson, ENT_QUOTES, 'UTF-8') . '\'></div>';
            } else {
                $content = $this->convertInlineMarkdown($encadre['content']);
                $replacement = '<div class="blog-encadre-placeholder" data-type="' . $encadre['type'] . '" data-content="' . htmlspecialchars($content, ENT_QUOTES, 'UTF-8') . '"></div>';
            }
            $html = str_replace($placeholder, $replacement, $html);
        }

        return $html;
    }

    /**
     * Traitement Markdown standard
     */
    private function processMarkdown(string $markdown): string
    {
        $html = $markdown;

        // Tableaux GFM (| col1 | col2 | ... | puis |---|---| puis | val | val |)
        $html = $this->processMarkdownTables($html);

        // Headers
        $html = preg_replace('/^### (.*?)$/m', '<h3>$1</h3>', $html);
        $html = preg_replace('/^## (.*?)$/m', '<h2>$1</h2>', $html);
        $html = preg_replace('/^# (.*?)$/m', '<h1>$1</h1>', $html);

        // Bold
        $html = preg_replace('/\*\*(.*?)\*\*/', '<strong>$1</strong>', $html);

        // Italic
        $html = preg_replace('/\*(.*?)\*/', '<em>$1</em>', $html);

        // Code blocks (```language)
        $html = preg_replace_callback(
            '/```(\w+)?\n(.*?)```/s',
            function ($matches) {
                $language = $matches[1] ?? '';
                $code = htmlspecialchars($matches[2], ENT_QUOTES, 'UTF-8');
                return '<pre><code class="language-' . htmlspecialchars($language, ENT_QUOTES, 'UTF-8') . '">' . $code . '</code></pre>';
            },
            $html
        );

        // Inline code
        $html = preg_replace('/`([^`]+)`/', '<code>$1</code>', $html);

        // Links [text](url)
        $html = preg_replace('/\[([^\]]+)\]\(([^\)]+)\)/', '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>', $html);

        // Lists (- item) : regrouper uniquement les <li> consécutifs en <ul>
        $html = preg_replace('/^- (.*?)$/m', '<li>$1</li>', $html);
        $html = preg_replace('/(<li>.*?<\/li>(?:\s*<li>.*?<\/li>)*)/s', '<ul>$1</ul>', $html);

        // Paragraphs (lignes vides = nouveau paragraphe)
        $html = preg_replace('/\n\n/', '</p><p>', $html);
        $html = '<p>' . $html . '</p>';
        $html = preg_replace('/<p><(h[1-6]|ul|pre|div|table)/', '<$1', $html);
        $html = preg_replace('/<\/(h[1-6]|ul|pre|div|table)><\/p>/', '</$1>', $html);

        // Line breaks
        $html = preg_replace('/\n/', '<br>', $html);
        $html = preg_replace('/<br><\/p>/', '</p>', $html);
        $html = preg_replace('/<p><br>/', '<p>', $html);

        return $html;
    }

    /**
     * Convertit les tableaux Markdown GFM en HTML <table>
     */
    private function processMarkdownTables(string $text): string
    {
        $lines = preg_split('/\r\n|\r|\n/', $text);
        $output = [];
        $i = 0;

        while ($i < count($lines)) {
            $line = $lines[$i];
            // Détecter une ligne d'en-tête de tableau : commence par | et contient au moins un |
            if (preg_match('/^\|.+\|$/', trim($line))) {
                $headerRow = $this->parseTableRow($line);
                $i++;
                if ($i >= count($lines)) {
                    $output[] = $line;
                    break;
                }
                $sepLine = trim($lines[$i]);
                // Ligne séparateur : |---| ou |:---| etc.
                if (preg_match('/^\|[\s\-:|\s]+\|$/', $sepLine)) {
                    $i++;
                    $bodyRows = [];
                    while ($i < count($lines) && preg_match('/^\|.+\|$/', trim($lines[$i]))) {
                        $bodyRows[] = $this->parseTableRow($lines[$i]);
                        $i++;
                    }
                    $tableHtml = $this->buildTableHtml($headerRow, $bodyRows);
                    $output[] = $tableHtml;
                    continue;
                }
                $output[] = $line;
                $i++;
                continue;
            }
            $output[] = $line;
            $i++;
        }

        return implode("\n", $output);
    }

    private function parseTableRow(string $line): array
    {
        $cells = [];
        $trimmed = trim($line);
        if ($trimmed === '' || $trimmed === '|') {
            return [];
        }
        $parts = explode('|', $trimmed);
        foreach ($parts as $part) {
            $part = trim($part);
            if ($part !== '') {
                $cells[] = $part;
            }
        }
        return $cells;
    }

    private function buildTableHtml(array $headerRow, array $bodyRows): string
    {
        $html = '<table><thead><tr>';
        foreach ($headerRow as $cell) {
            $html .= '<th>' . htmlspecialchars($cell, ENT_QUOTES, 'UTF-8') . '</th>';
        }
        $html .= '</tr></thead><tbody>';
        foreach ($bodyRows as $row) {
            $html .= '<tr>';
            foreach ($row as $cell) {
                $html .= '<td>' . htmlspecialchars($cell, ENT_QUOTES, 'UTF-8') . '</td>';
            }
            $html .= '</tr>';
        }
        $html .= '</tbody></table>';
        return $html;
    }

    /**
     * Convertit le Markdown inline (bold, italic, code, links) sans toucher aux blocs
     */
    private function convertInlineMarkdown(string $text): string
    {
        // Bold
        $text = preg_replace('/\*\*(.*?)\*\*/', '<strong>$1</strong>', $text);
        // Italic
        $text = preg_replace('/\*(.*?)\*/', '<em>$1</em>', $text);
        // Inline code
        $text = preg_replace('/`([^`]+)`/', '<code>$1</code>', $text);
        // Links
        $text = preg_replace('/\[([^\]]+)\]\(([^\)]+)\)/', '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>', $text);
        
        return $text;
    }
}
