# Creative Importer Pro ⚡

Application React professionnelle pour importer et gérer vos créatives publicitaires sur Meta Ads (Facebook & Instagram) avec une interface moderne et intuitive.

## Fonctionnalités

- 🔐 **Authentification OAuth Facebook** - Connexion sécurisée via Facebook
- 📊 **Gestion de comptes publicitaires** - Sélection et gestion de vos comptes Meta Ads
- 📄 **Pages Facebook & Instagram** - Intégration complète avec vos pages
- 🎯 **Configuration de campagnes** - Support CBO (Campaign Budget Optimization) et ABO (Adset Budget Optimization)
- 📁 **Upload de créatives** - Glisser-déposer pour images et vidéos
- 🎨 **Détection automatique de format** - Reconnaissance automatique des formats (Stories, Feed 1:1, Feed 4:5, Feed 16:9)
- 🌍 **Ciblage géographique** - Support multi-pays (France, Belgique, Suisse, Canada, USA, UK, Allemagne)
- 📝 **Configuration complète des ads** - Textes, titres, CTA, URL de destination
- 📥 **Export JSON** - Exportez votre configuration pour réutilisation
- 🚀 **Lancement direct sur Meta** - Poussez vos campagnes directement sur Meta Ads

## Prérequis

- Node.js 14+ et npm/yarn
- Un compte Facebook Business
- Une application Facebook configurée sur [developers.facebook.com](https://developers.facebook.com)

## Configuration de l'application Facebook

### 1. Créer une application Facebook

1. Allez sur [Facebook Developers](https://developers.facebook.com/apps)
2. Cliquez sur "Create App" (Créer une application)
3. Sélectionnez "Business" comme type d'application
4. Remplissez les informations de votre application

### 2. Configurer Facebook Login

1. Dans le dashboard de votre app, allez dans "Add Product"
2. Activez "Facebook Login"
3. Allez dans "Settings" > "Facebook Login" > "Settings"
4. Dans "Valid OAuth Redirect URIs", ajoutez :
   - `http://localhost:3000/` (pour le développement local)
   - `https://creative-importer.vercel.app/` (pour la production)
   - Votre domaine personnalisé si vous en avez un

### 3. Configurer les permissions

Dans "App Review" > "Permissions and Features", demandez les permissions suivantes :

- `ads_management` - Gérer les publicités
- `ads_read` - Lire les données publicitaires
- `business_management` - Gérer les Business Managers
- `pages_read_engagement` - Lire l'engagement des pages
- `pages_show_list` - Afficher la liste des pages
- `instagram_content_publish` - Publier du contenu Instagram (optionnel)
- `pages_read_user_content` - Lire le contenu des pages (optionnel)

**Important** : Certaines permissions nécessitent une validation par Facebook (App Review). Pour le développement, vous pouvez ajouter des utilisateurs test dans "Roles" > "Test Users".

### 4. Récupérer votre App ID

1. Dans le dashboard de votre app, copiez l'**App ID** affiché en haut
2. Remplacez-le dans le fichier `src/App.js` ligne 12 :

```javascript
const META_APP = {
  appId: "VOTRE_APP_ID_ICI", // Remplacez par votre App ID
  apiVersion: "v21.0",
  redirectUri: window.location.origin + window.location.pathname,
};
```

### 5. Mettre l'app en mode Live (Production)

1. Dans le dashboard, en haut, passez votre app de "Development" à "Live"
2. Assurez-vous que toutes les permissions requises sont approuvées

## Installation

### Installation locale

```bash
# Cloner le repository
git clone https://github.com/ThomasB1105/Creative-importer.git
cd Creative-importer

# Installer les dépendances
npm install

# Lancer en mode développement
npm start
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

### Déploiement sur Vercel

1. Forkez ou clonez ce repository
2. Allez sur [vercel.com](https://vercel.com)
3. Importez votre repository
4. Vercel détectera automatiquement qu'il s'agit d'une app React
5. Cliquez sur "Deploy"

**Important** : Après le déploiement, n'oubliez pas d'ajouter l'URL de production dans les "Valid OAuth Redirect URIs" de votre app Facebook.

## Structure du projet

```
Creative-importer/
├── public/
│   └── index.html          # Template HTML
├── src/
│   ├── App.js              # Composant principal (toute la logique)
│   ├── index.js            # Point d'entrée React
│   └── styles.css          # Styles (peu utilisés, styles inline dans App.js)
├── package.json            # Dépendances
└── README.md              # Ce fichier
```

## Utilisation

### 1. Connexion

1. Cliquez sur "Continuer avec Facebook"
2. Autorisez les permissions demandées
3. Vous serez redirigé vers l'application

### 2. Sélection du compte

1. Sélectionnez votre compte publicitaire
2. Choisissez le pixel de suivi (optionnel)
3. Sélectionnez votre page Facebook (avec Instagram si disponible)

### 3. Structure de campagne

Choisissez votre structure :

- **CBO** (Campaign Budget Optimization) : Meta optimise le budget entre les adsets
  - Nouvelle campagne
  - Campagne existante + Nouvel adset
  - Campagne existante + Adset existant

- **ABO** (Adset Budget Optimization) : Budget défini par adset
  - Structure 1:1:1 (1 campagne par créa)
  - Structure Multi (1 campagne → plusieurs adsets)

### 4. Configuration

1. Définissez votre budget journalier
2. Sélectionnez les zones géographiques
3. Choisissez l'objectif (Conversions, Lead Form, Lead Site)
4. Remplissez les textes et le titre
5. Ajoutez l'URL de destination
6. Définissez votre nomenclature (code client, nom de campagne)

### 5. Upload des créatives

1. Glissez-déposez vos fichiers (images/vidéos) ou cliquez sur "Parcourir"
2. L'application détecte automatiquement les formats
3. Modifiez les noms des ads si nécessaire
4. Les créatives sont groupées par format et type

### 6. Export et lancement

1. Vérifiez le résumé de votre structure
2. Exportez en JSON pour sauvegarder la configuration
3. Cliquez sur "Lancer sur Meta" pour créer les campagnes (à venir)

## Formats supportés

L'application détecte automatiquement les formats selon les ratios :

- **Stories (9:16)** : Ratio 0.5 - 0.625
- **Feed 1:1** : Ratio 0.9 - 1.1
- **Feed 4:5** : Ratio 0.75 - 0.89
- **Feed 16:9** : Ratio 1.5 - 2.0

## Technologies utilisées

- **React 19** - Framework JavaScript
- **Meta Graph API v21.0** - API Meta Ads
- **OAuth 2.0** - Authentification Facebook
- **React Hooks** - useState, useEffect, useMemo, useCallback

## Sécurité

- Le token d'accès est stocké dans localStorage avec expiration
- Aucun mot de passe n'est stocké
- Authentification via OAuth Facebook sécurisée
- Les tokens expirés sont automatiquement détectés et nettoyés

## Dépannage

### Erreur "Invalid Scopes"

Les permissions Instagram ont changé. Assurez-vous que votre app Facebook est à jour et que vous avez les bonnes permissions configurées.

### L'authentification ne fonctionne pas

1. Vérifiez que votre App ID est correct
2. Vérifiez que l'URL de redirection est configurée dans Facebook
3. Vérifiez que votre app est en mode "Live" (pour la production)
4. Ouvrez la console du navigateur pour voir les erreurs détaillées

### Impossible de voir mes comptes publicitaires

Assurez-vous que :
1. Vous avez accès aux comptes dans Business Manager
2. Les permissions `ads_management` et `ads_read` sont accordées
3. Votre app Facebook a les permissions validées

## Roadmap

- [x] Authentification OAuth Facebook
- [x] Sélection des comptes et pages
- [x] Upload et détection de format
- [x] Configuration complète des campagnes
- [x] Export JSON
- [ ] API réelle de création de campagnes Meta
- [ ] Gestion des audiences personnalisées
- [ ] Preview des créatives
- [ ] Historique des imports
- [ ] Support des carrousels

## Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## Licence

MIT

## Support

Pour toute question ou problème, ouvrez une issue sur [GitHub](https://github.com/ThomasB1105/Creative-importer/issues).

---

Développé avec ❤️ pour simplifier la gestion de vos campagnes Meta Ads
