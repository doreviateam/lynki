package docx

import (
	"archive/zip"
	"bytes"
	"fmt"
	"math"
	"strings"

	"github.com/doreviateam/diva/internal/facts"
)

// BrandingConfig configuration de branding optionnelle.
type BrandingConfig struct {
	ProductName string `json:"product_name,omitempty"`
	CompanyName string `json:"company_name,omitempty"`
	Baseline    string `json:"baseline,omitempty"`
	TitleColor  string `json:"title_color,omitempty"`
	LogoPath    string `json:"logo_path,omitempty"`
}

var defaultBranding = BrandingConfig{
	ProductName: "Dorevia Lynki",
	CompanyName: "Dorevia",
	TitleColor:  "1B3A5C",
}

func (b *BrandingConfig) titleColor() string {
	if b.TitleColor != "" {
		return b.TitleColor
	}
	return "1B3A5C"
}

// RenderReport génère un document DOCX à partir du rapport structuré.
// Si branding est nil, fallback sobre "Dorevia Lynki".
func RenderReport(report *facts.AccountingReport, branding *BrandingConfig) ([]byte, error) {
	if report == nil {
		return nil, fmt.Errorf("report is nil")
	}

	b := branding
	if b == nil {
		b = &defaultBranding
	}

	body := buildDocumentBody(report, b)

	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)

	files := map[string]string{
		"[Content_Types].xml":          contentTypesXML,
		"_rels/.rels":                  relsXML,
		"word/_rels/document.xml.rels": wordRelsXML,
		"word/document.xml":            body,
		"word/styles.xml":              stylesXML,
		"word/footer1.xml":             buildFooter(report, b),
	}

	for name, content := range files {
		w, err := zw.Create(name)
		if err != nil {
			return nil, fmt.Errorf("create zip entry %s: %w", name, err)
		}
		if _, err := w.Write([]byte(content)); err != nil {
			return nil, fmt.Errorf("write zip entry %s: %w", name, err)
		}
	}

	if err := zw.Close(); err != nil {
		return nil, fmt.Errorf("close zip: %w", err)
	}

	return buf.Bytes(), nil
}

type docSection struct {
	title  string
	render func() string
}

func buildDocumentBody(r *facts.AccountingReport, b *BrandingConfig) string {
	var parts []string

	// --- Title page (borderless table for stable centered layout) ---
	parts = append(parts, buildTitlePage(r, b))

	// --- Page break ---
	parts = append(parts, pageBreak())

	// --- Build section list (dynamic numbering, conditional inclusion) ---
	sections := buildSections(r, b)

	// --- Table of contents ---
	parts = append(parts, heading1WithColor("Sommaire", b.titleColor()))
	for i, s := range sections {
		parts = append(parts, paragraph(fmt.Sprintf("%d. %s", i+1, s.title)))
	}

	parts = append(parts, pageBreak())

	// --- Render each section ---
	for i, s := range sections {
		parts = append(parts, heading1WithColor(fmt.Sprintf("%d. %s", i+1, s.title), b.titleColor()))
		parts = append(parts, s.render())
	}

	return wrapDocument(strings.Join(parts, "\n"))
}

func buildTitlePage(r *facts.AccountingReport, b *BrandingConfig) string {
	color := b.titleColor()

	var rows []string
	rows = append(rows, titleTableRow(heading1WithColor("Synthèse comptable", color)))
	rows = append(rows, titleTableRow(heading2Centered(escapeXML(r.Header.Tenant))))
	rows = append(rows, titleTableRow(centeredParagraph("")))
	rows = append(rows, titleTableRow(centeredParagraph(fmt.Sprintf("Période : %s — %s", escapeXML(r.Header.PeriodStart), escapeXML(r.Header.PeriodEnd)))))
	rows = append(rows, titleTableRow(centeredParagraph(fmt.Sprintf("Généré le %s", escapeXML(r.Header.GeneratedAt[:10])))))
	rows = append(rows, titleTableRow(centeredParagraph(fmt.Sprintf("par %s", escapeXML(b.ProductName)))))
	if b.Baseline != "" {
		rows = append(rows, titleTableRow(centeredParagraph(escapeXML(b.Baseline))))
	}

	return fmt.Sprintf(`    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="9000" w:type="dxa"/>
        <w:jc w:val="center"/>
        <w:tblBorders>
          <w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/>
          <w:left w:val="none" w:sz="0" w:space="0" w:color="auto"/>
          <w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/>
          <w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/>
          <w:insideH w:val="none" w:sz="0" w:space="0" w:color="auto"/>
          <w:insideV w:val="none" w:sz="0" w:space="0" w:color="auto"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tblGrid><w:gridCol w:w="9000"/></w:tblGrid>
%s
    </w:tbl>`, strings.Join(rows, "\n"))
}

func titleTableRow(content string) string {
	return fmt.Sprintf("      <w:tr><w:tc>%s</w:tc></w:tr>", content)
}

func buildSections(r *facts.AccountingReport, b *BrandingConfig) []docSection {
	var sections []docSection

	sections = append(sections, docSection{
		title: "Synthèse",
		render: func() string {
			var p []string
			p = append(p, heading2(r.ExecutiveSummary.Headline))
			p = append(p, paragraph(r.ExecutiveSummary.WhatISee))
			return strings.Join(p, "\n")
		},
	})

	sections = append(sections, docSection{
		title: "Points de vigilance",
		render: func() string {
			return paragraph(r.Vigilance.ToCheck)
		},
	})

	if r.BalanceSheetTable != nil && len(r.BalanceSheetTable.Lines) > 0 {
		sections = append(sections, docSection{
			title: "Bilan",
			render: func() string {
				return renderTable(r.BalanceSheetTable, r.Header.Currency)
			},
		})
	}

	if r.IncomeStatementTable != nil && len(r.IncomeStatementTable.Lines) > 0 {
		sections = append(sections, docSection{
			title: "Compte de résultat",
			render: func() string {
				return renderTable(r.IncomeStatementTable, r.Header.Currency)
			},
		})
	}

	if r.AgedBalancesSummary != nil && (len(r.AgedBalancesSummary.TopReceivables) > 0 || len(r.AgedBalancesSummary.TopPayables) > 0) {
		sections = append(sections, docSection{
			title: "Balances tiers",
			render: func() string {
				var p []string
				if len(r.AgedBalancesSummary.TopReceivables) > 0 {
					p = append(p, heading2("Clients"))
					p = append(p, renderAgedPartners(r.AgedBalancesSummary.TopReceivables, r.Header.Currency))
				}
				if len(r.AgedBalancesSummary.TopPayables) > 0 {
					p = append(p, heading2("Fournisseurs"))
					p = append(p, renderAgedPartners(r.AgedBalancesSummary.TopPayables, r.Header.Currency))
				}
				return strings.Join(p, "\n")
			},
		})
	}

	sections = append(sections, docSection{
		title: "Périmètre et couverture",
		render: func() string {
			return renderScopeSection(r, b)
		},
	})

	return sections
}

func renderScopeSection(r *facts.AccountingReport, b *BrandingConfig) string {
	var p []string
	p = append(p, paragraph(fmt.Sprintf("Période : %s — %s", r.Header.PeriodStart, r.Header.PeriodEnd)))
	p = append(p, paragraph(fmt.Sprintf("Tenant : %s", r.Header.Tenant)))
	if len(r.Header.Companies) > 0 {
		ids := make([]string, len(r.Header.Companies))
		for i, id := range r.Header.Companies {
			ids[i] = fmt.Sprintf("%d", id)
		}
		p = append(p, paragraph(fmt.Sprintf("Société(s) : %s", strings.Join(ids, ", "))))
	}
	p = append(p, paragraph(fmt.Sprintf("Date de génération : %s", r.Header.GeneratedAt[:10])))
	p = append(p, paragraph(fmt.Sprintf("template_version : %s", r.Scope.TemplateVersion)))
	p = append(p, paragraph(fmt.Sprintf("facts_hash : %s", r.Scope.FactsHash)))
	p = append(p, paragraph(fmt.Sprintf("Référentiel : %s", r.Scope.Referentiel)))
	p = append(p, paragraph(fmt.Sprintf("Couverture : Bilan=%s, CR=%s, Tiers=%s", r.Scope.CoverageBS, r.Scope.CoverageCR, r.Scope.CoverageAged)))
	if len(r.Scope.Limitations) > 0 {
		p = append(p, paragraph("Limitations : "+strings.Join(r.Scope.Limitations, " ; ")))
	}
	return strings.Join(p, "\n")
}

func renderTable(t *facts.ReportTable, currency string) string {
	hasN1 := false
	for _, l := range t.Lines {
		if l.AmountN1 != nil {
			hasN1 = true
			break
		}
	}

	if !hasN1 {
		return renderTableSimple(t, currency)
	}
	return renderTableWithComparison(t, currency)
}

func renderTableSimple(t *facts.ReportTable, currency string) string {
	var rows []string

	rows = append(rows, tableRow([]string{
		tableCell("Rubrique", true),
		tableCell("N ("+currency+")", true),
	}))

	for _, l := range t.Lines {
		label := l.Label
		if l.Code != "" {
			label = l.Code + " — " + l.Label
		}
		rows = append(rows, tableRow([]string{
			tableCell(label, false),
			tableCellAmount(l.AmountN),
		}))
	}

	rows = append(rows, tableRow([]string{
		tableCell("TOTAL", true),
		tableCellAmount(t.Total.AmountN),
	}))

	return tableWrap(2, strings.Join(rows, "\n"))
}

func renderTableWithComparison(t *facts.ReportTable, currency string) string {
	var rows []string

	rows = append(rows, tableRow([]string{
		tableCell("Rubrique", true),
		tableCell("N ("+currency+")", true),
		tableCell("N-1 ("+currency+")", true),
		tableCell("Écart ("+currency+")", true),
		tableCell("Variation", true),
	}))

	for _, l := range t.Lines {
		label := l.Label
		if l.Code != "" {
			label = l.Code + " — " + l.Label
		}
		rows = append(rows, tableRow(buildComparisonRow(label, l, false)))
	}

	rows = append(rows, tableRow(buildComparisonRow("TOTAL", t.Total, true)))

	return tableWrap(5, strings.Join(rows, "\n"))
}

func buildComparisonRow(label string, l facts.ReportTableLine, bold bool) []string {
	cells := []string{tableCell(label, bold), tableCellAmount(l.AmountN)}

	if l.AmountN1 != nil {
		n1 := *l.AmountN1
		cells = append(cells, tableCellAmount(n1))

		ecart := l.AmountN - n1
		cells = append(cells, tableCellAmountSigned(ecart))
		cells = append(cells, tableCell(fmtVariation(l.AmountN, n1), bold))
	} else {
		cells = append(cells, tableCell("—", bold))
		cells = append(cells, tableCell("—", bold))
		cells = append(cells, tableCell("—", bold))
	}

	return cells
}

func fmtVariation(amountN, amountN1 float64) string {
	if math.Abs(amountN1) < 0.005 && math.Abs(amountN) < 0.005 {
		return "—"
	}
	if math.Abs(amountN1) < 0.005 {
		return "n/a"
	}

	pct := ((amountN - amountN1) / math.Abs(amountN1)) * 100

	if math.Abs(pct) < 0.1 {
		return "0,0 %"
	}

	arrow := " ▲"
	sign := "+"
	if pct < 0 {
		arrow = " ▼"
		sign = "-"
		pct = -pct
	}
	return fmt.Sprintf("%s%.1f %%%s", sign, pct, arrow)
}

func renderAgedPartners(partners []facts.ReportAgedPartner, currency string) string {
	var rows []string
	rows = append(rows, tableRow([]string{
		tableCell("Partenaire", true),
		tableCell("Total ("+currency+")", true),
		tableCell("> 90j ("+currency+")", true),
	}))
	for _, p := range partners {
		rows = append(rows, tableRow([]string{
			tableCell(p.PartnerName, false),
			tableCellAmount(p.Total),
			tableCellAmount(p.RangeOver90),
		}))
	}
	return tableWrap(3, strings.Join(rows, "\n"))
}

func buildFooter(r *facts.AccountingReport, b *BrandingConfig) string {
	text := fmt.Sprintf("%s | %s | %s | %s — template-first",
		r.Scope.FactsHash, r.Scope.TemplateVersion, r.Header.GeneratedAt[:10], b.ProductName)
	return fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:sz w:val="16"/><w:color w:val="888888"/></w:rPr></w:pPr>
    <w:r><w:rPr><w:sz w:val="16"/><w:color w:val="888888"/></w:rPr><w:t>%s</w:t></w:r>
  </w:p>
</w:ftr>`, escapeXML(text))
}

// --- XML building blocks ---

func wrapDocument(body string) string {
	return fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
%s
    <w:sectPr>
      <w:footerReference w:type="default" r:id="rId2"/>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`, body)
}

func heading1(text string) string {
	return fmt.Sprintf(`    <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>%s</w:t></w:r></w:p>`, escapeXML(text))
}

func heading1WithColor(text string, color string) string {
	if color == "" {
		color = "1B3A5C"
	}
	return fmt.Sprintf(`    <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:color w:val="%s"/></w:rPr><w:t>%s</w:t></w:r></w:p>`, color, escapeXML(text))
}

func heading2(text string) string {
	return fmt.Sprintf(`    <w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>%s</w:t></w:r></w:p>`, escapeXML(text))
}

func heading2Centered(text string) string {
	return fmt.Sprintf(`<w:p><w:pPr><w:pStyle w:val="Heading2"/><w:jc w:val="center"/></w:pPr><w:r><w:t>%s</w:t></w:r></w:p>`, text)
}

func paragraph(text string) string {
	return fmt.Sprintf(`    <w:p><w:r><w:t xml:space="preserve">%s</w:t></w:r></w:p>`, escapeXML(text))
}

func centeredParagraph(text string) string {
	return fmt.Sprintf(`<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t xml:space="preserve">%s</w:t></w:r></w:p>`, text)
}

func pageBreak() string {
	return `    <w:p><w:r><w:br w:type="page"/></w:r></w:p>`
}

func tableWrap(cols int, rows string) string {
	colW := 9000 / cols
	var gridCols string
	for i := 0; i < cols; i++ {
		gridCols += fmt.Sprintf(`<w:gridCol w:w="%d"/>`, colW)
	}
	return fmt.Sprintf(`    <w:tbl>
      <w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
        <w:left w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
        <w:right w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
      </w:tblBorders></w:tblPr>
      <w:tblGrid>%s</w:tblGrid>
%s
    </w:tbl>`, gridCols, rows)
}

func tableRow(cells []string) string {
	return fmt.Sprintf("      <w:tr>%s</w:tr>", strings.Join(cells, ""))
}

func tableCell(text string, bold bool) string {
	rpr := ""
	if bold {
		rpr = "<w:rPr><w:b/></w:rPr>"
	}
	return fmt.Sprintf(`<w:tc><w:p><w:r>%s<w:t>%s</w:t></w:r></w:p></w:tc>`, rpr, escapeXML(text))
}

func tableCellAmount(amount float64) string {
	return fmt.Sprintf(`<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr><w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:t>%s</w:t></w:r></w:p></w:tc>`, fmtAmount(amount))
}

func tableCellAmountSigned(amount float64) string {
	return fmt.Sprintf(`<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr><w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:t>%s</w:t></w:r></w:p></w:tc>`, fmtAmountSigned(amount))
}

func fmtAmount(v float64) string {
	if math.Abs(v) < 0.005 {
		return "0,00"
	}
	sign := ""
	if v < 0 {
		sign = "-"
		v = -v
	}
	whole := int64(v)
	frac := int64(math.Round((v - float64(whole)) * 100))
	if frac >= 100 {
		whole++
		frac -= 100
	}

	s := fmt.Sprintf("%d", whole)
	var grouped []string
	for len(s) > 3 {
		grouped = append([]string{s[len(s)-3:]}, grouped...)
		s = s[:len(s)-3]
	}
	grouped = append([]string{s}, grouped...)

	return fmt.Sprintf("%s%s,%02d", sign, strings.Join(grouped, "\u00A0"), frac)
}

func fmtAmountSigned(v float64) string {
	if math.Abs(v) < 0.005 {
		return "0,00"
	}
	sign := "+"
	abs := v
	if v < 0 {
		sign = "-"
		abs = -v
	}
	whole := int64(abs)
	frac := int64(math.Round((abs - float64(whole)) * 100))
	if frac >= 100 {
		whole++
		frac -= 100
	}

	s := fmt.Sprintf("%d", whole)
	var grouped []string
	for len(s) > 3 {
		grouped = append([]string{s[len(s)-3:]}, grouped...)
		s = s[:len(s)-3]
	}
	grouped = append([]string{s}, grouped...)

	return fmt.Sprintf("%s%s,%02d", sign, strings.Join(grouped, "\u00A0"), frac)
}

func escapeXML(s string) string {
	s = strings.ReplaceAll(s, "&", "&amp;")
	s = strings.ReplaceAll(s, "<", "&lt;")
	s = strings.ReplaceAll(s, ">", "&gt;")
	s = strings.ReplaceAll(s, "\"", "&quot;")
	return s
}

// --- Static XML parts ---

const contentTypesXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
</Types>`

const relsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

const wordRelsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
</Relationships>`

const stylesXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="1B3A5C"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:pPr><w:spacing w:before="200" w:after="80"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="2D5A8E"/></w:rPr>
  </w:style>
  <w:style w:type="table" w:styleId="TableGrid">
    <w:name w:val="Table Grid"/>
    <w:tblPr>
      <w:tblBorders>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
        <w:left w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
        <w:right w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
      </w:tblBorders>
    </w:tblPr>
  </w:style>
</w:styles>`
