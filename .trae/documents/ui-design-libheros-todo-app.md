## 1. Direction visuelle

L'interface vise un rendu professionnel, sobre et premium, adapté à un contexte métier. Le ton visuel doit inspirer confiance, fluidité et efficacité, sans surcharge décorative.

- Style général : moderne, structuré, apaisé
- Densité : moyenne, optimisée pour usage quotidien
- Priorité : lisibilité, hiérarchie visuelle, feedback immédiat
- Approche : desktop-first avec adaptation mobile

## 2. Tokens de design

### 2.1 Palette

- Fond principal : `zinc-50`
- Surface principale : `white`
- Surface secondaire : `zinc-100`
- Texte principal : `zinc-900`
- Texte secondaire : `zinc-500`
- Accent principal : `blue-600`
- Accent hover : `blue-700`
- Succès / terminé : `emerald-600`
- Danger : `rose-600`
- Bordures : `zinc-200`

### 2.2 Typographie

- Police UI : sans-serif moderne, lisible et sobre
- Titres page : fort contraste, graisse `semibold` ou `bold`
- Titres de section : `text-sm` ou `text-base`
- Texte courant : `text-sm`
- Métadonnées : `text-xs`

### 2.3 Rayons, ombres et espacements

- Rayon cartes : `rounded-2xl`
- Rayon champs : `rounded-xl`
- Ombres : légères à moyennes, jamais agressives
- Grille d'espacement : base de `4px`

## 3. Structure des écrans

## 3.1 Page d'authentification

Objectif : rassurer immédiatement et rendre la connexion ou l'inscription évidente.

Composition :

- conteneur centré verticalement et horizontalement,
- carte d'authentification avec deux onglets ou un switch connexion / inscription,
- titre clair,
- sous-texte explicatif court,
- formulaire espacé et très lisible,
- zone de messages d'erreur ou de validation.

Comportements :

- bouton principal pleine largeur,
- erreurs inline sous les champs,
- chargement visible pendant soumission,
- bascule connexion / inscription sans rupture visuelle.

## 3.2 Page principale

Composition générale en trois zones :

- left sidebar,
- main content,
- right sidebar contextuelle.

### Left sidebar

Rôle :

- afficher les listes de l'utilisateur,
- permettre la création rapide d'une nouvelle liste,
- matérialiser la liste active,
- permettre la suppression avec confirmation.

Règles UI :

- largeur fixe desktop,
- bouton de création visible en haut,
- liste scrollable si nécessaire,
- item actif très identifiable,
- action destructive discrète mais accessible.

### Main content

Rôle :

- afficher les tâches de la liste active,
- permettre la création de tâche,
- séparer clairement tâches actives et terminées.

Règles UI :

- si aucune liste n'est sélectionnée, afficher un état vide pédagogique,
- formulaire de création affiché en haut,
- cartes de tâches compactes, cliquables, avec statut visible,
- section "Mes tâches terminées" repliée par défaut,
- transitions légères lors du changement de statut.

### Right sidebar

Rôle :

- afficher le détail complet de la tâche sélectionnée,
- rendre les métadonnées compréhensibles,
- permettre la suppression après confirmation.

Règles UI :

- visible uniquement quand une tâche est sélectionnée,
- hiérarchie claire entre titre, descriptions et dates,
- bouton de suppression placé en bas ou dans une zone bien identifiée,
- état vide si aucune tâche n'est sélectionnée sur desktop étroit.

## 4. Composants clés

| Composant | Rôle | Notes UX |
|-----------|------|----------|
| `AuthCard` | Encapsule connexion / inscription | Structure stable, validations visibles |
| `AppSidebar` | Navigation listes | Focus sur la lisibilité et l'état sélectionné |
| `CreateListModal` | Création de liste | Validation de nom unique côté UI + API |
| `TaskForm` | Création / édition de tâche | Flux simple, 3 champs principaux |
| `TaskCard` | Représentation d'une tâche | Statut, échéance et clic vers détail |
| `CompletedTasksAccordion` | Liste repliable des tâches terminées | Compact, clair, rapide à parcourir |
| `TaskDetailPanel` | Détail d'une tâche | Lecture et action de suppression |
| `ConfirmationModal` | Confirmation des suppressions | Message explicite, risque bien visible |

## 5. États d'interface

- `loading` : skeletons ou placeholders légers
- `empty` : messages utiles, jamais des écrans vides
- `error` : message clair, contextualisé, avec action possible si pertinent
- `success` : retour discret, par exemple toast ou état visuel
- `realtime` : mise à jour immédiate sans clignotement ni refetch visible

## 6. Interactions clés

- clic sur une liste : charge son contenu et rejoint la room WebSocket correspondante
- création de tâche : insertion instantanée dans la liste visible
- tâche terminée : bascule immédiate dans la section dédiée
- tâche réactivée : retour immédiat dans la liste active
- suppression de liste ou de tâche : confirmation obligatoire avant action destructive

## 7. Accessibilité et qualité perçue

- contrastes suffisants sur tous les textes et boutons
- focus visible clavier sur tous les éléments interactifs
- labels explicites sur les champs
- boutons d'action destructive clairement identifiés
- animations sobres et rapides, jamais bloquantes

## 8. Responsive

- desktop : trois colonnes visibles
- tablette : sidebars plus compactes, détail potentiellement en panneau superposé
- mobile : navigation par panneaux, priorité au contenu principal et aux formulaires

## 9. Intention de rendu final

L'application doit donner la sensation d'un outil réellement exploitable en entreprise :

- fiable,
- net,
- rapide,
- clair,
- crédible pour un poste de lead developer.
