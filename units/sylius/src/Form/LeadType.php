<?php

namespace App\Form;

use App\Entity\Lead;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\EmailType;
use Symfony\Component\Form\Extension\Core\Type\HiddenType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Formulaire de capture de lead
 * 
 * Formulaire avec validation, CSRF et honeypot anti-spam.
 */
class LeadType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            // Email (obligatoire)
            ->add('email', EmailType::class, [
                'label' => 'Email',
                'required' => true,
                'attr' => [
                    'placeholder' => 'votre@email.com',
                    'autocomplete' => 'email',
                ],
                'constraints' => [
                    new Assert\NotBlank([
                        'message' => 'L\'email est obligatoire',
                    ]),
                    new Assert\Email([
                        'message' => 'L\'email n\'est pas valide',
                    ]),
                ],
            ])

            // Message (obligatoire)
            ->add('message', TextareaType::class, [
                'label' => 'Message',
                'required' => true,
                'attr' => [
                    'placeholder' => 'Votre message...',
                    'rows' => 5,
                ],
                'constraints' => [
                    new Assert\NotBlank([
                        'message' => 'Le message est obligatoire',
                    ]),
                    new Assert\Length(
                        min: 10,
                        max: 2000,
                        minMessage: 'Le message doit contenir au moins {{ limit }} caractères',
                        maxMessage: 'Le message ne peut pas dépasser {{ limit }} caractères',
                    ),
                ],
            ])

            // Entreprise (optionnel) - utilise companyName
            ->add('companyName', TextType::class, [
                'label' => 'Entreprise',
                'required' => false,
                'attr' => [
                    'placeholder' => 'Nom de votre entreprise (optionnel)',
                ],
            ])

            // Role (optionnel maintenant, pour compatibilité)
            ->add('role', ChoiceType::class, [
                'label' => 'Rôle',
                'required' => false,
                'choices' => [
                    'Dirigeant' => 'dirigeant',
                    'DAF / RAF' => 'daf',
                    'Expert-comptable' => 'expert_comptable',
                    'Responsable administratif' => 'responsable_admin',
                    'Autre' => 'autre',
                ],
                'placeholder' => 'Sélectionnez votre rôle (optionnel)',
                'attr' => [
                    'class' => 'form-select',
                ],
                'constraints' => [
                    new Assert\Choice([
                        'choices' => ['dirigeant', 'daf', 'expert_comptable', 'responsable_admin', 'autre'],
                        'message' => 'Le rôle sélectionné n\'est pas valide',
                    ]),
                ],
            ])

            // Honeypot anti-spam (champ caché)
            ->add('website', HiddenType::class, [
                'required' => false,
                'mapped' => false, // Ne pas mapper à l'entité
                'attr' => [
                    'tabindex' => '-1',
                    'autocomplete' => 'off',
                    'style' => 'display: none;',
                ],
            ]);
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => Lead::class,
            'csrf_protection' => true,
            'csrf_field_name' => '_token',
            'csrf_token_id' => 'lead_form',
        ]);
    }
}
