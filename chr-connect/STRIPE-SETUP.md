# Stripe Connect — Guide configuration (mode test)

> Objectif : activer Stripe Connect marketplace pour que les prestataires puissent recevoir des paiements. À suivre **une seule fois** avant de tester le Sprint 3.
> Compte Stripe utilisé : celui associé à ConnectCHR (clés déjà dans `.env.local`).

---

## ÉTAPE 1 — Vérifier que tu es bien en mode TEST

1. Va sur https://dashboard.stripe.com
2. Connecte-toi avec le compte Stripe de ConnectCHR
3. En haut à droite du dashboard, il y a un **toggle "Test mode"** (orange)
4. Assure-toi qu'il est **ACTIVÉ** (orange visible)
5. Si tu vois tes "vrais" comptes clients / paiements, tu es en live → clique le toggle pour passer en test

**Toutes les étapes suivantes se font en mode test.** Aucune vraie carte, aucun vrai argent.

---

## ÉTAPE 2 — Activer Stripe Connect

### 2.1 Aller dans Connect

Dans le menu gauche du dashboard, cherche **"Connect"**.

- Si tu le vois → clique dessus → passer à l'étape 2.2
- Si tu ne le vois pas → clique sur **"More"** / **"Plus"** en bas du menu → cherche "Connect" → clique

**URL directe si tu galères** : https://dashboard.stripe.com/test/connect/accounts/overview

### 2.2 Premier lancement de Connect

Si c'est la première fois que Connect est utilisé sur ce compte, tu vas voir un écran d'accueil avec un gros bouton bleu **"Get started"** ou **"Commencer"** ou **"Onboard your first account"**.

- Clique dessus
- Passe à 2.3

Sinon, si tu vois déjà un écran "Accounts" avec une liste (même vide), Connect est déjà activé → **saute à l'étape 3**.

### 2.3 Questionnaire d'activation

Stripe va te poser 3-4 questions. Voici quoi répondre :

**Q1 : "What's your platform's industry?" / "Quel est le secteur de ta plateforme ?"**
→ Sélectionne **Marketplace** (ou "Marketplaces" / "Place de marché")

**Q2 : "Where is your platform based?" / "Où est basée ta plateforme ?"**
→ **France**

**Q3 : "How do you plan to pay out your users?" / "Comment vas-tu payer tes utilisateurs ?"**
→ **I'll pay out directly to their bank accounts** / **Directement sur leur compte bancaire**

**Q4 : "What type of Connect account will you use?" / "Type de comptes Connect ?"**
→ Tu vois 3 options : Standard, Express, Custom
→ Coche **Express** (c'est ce qu'on utilise dans le code)

**Q5 (si demandé) : "What will your platform do?" / "Que fait ta plateforme ?"**
→ Description libre, mets : "Plateforme de mise en relation entre établissements de restauration et personnel extra / techniciens de maintenance"

→ Clique **"Continue"** / **"Next"** à chaque étape

### 2.4 Branding de la plateforme

Stripe te demande le nom/logo de ta plateforme (c'est ce que verront les prestataires pendant l'onboarding).

- **Business name** : `ConnectCHR`
- **Brand color** : laisse par défaut ou mets `#3B82F6` (bleu)
- **Logo** : skip pour l'instant (optionnel en test)
- **Support email** : `support@home-chr.fr`
- **Support URL** : `https://connectchr.vercel.app` (ou ignore)

→ Sauvegarder

### 2.5 Validation

Tu dois maintenant voir un dashboard Connect avec une liste vide "0 accounts" ou similaire.

✅ **Connect est activé.**

---

## ÉTAPE 3 — Configurer le Webhook

Le webhook est un endpoint qui reçoit les notifications de Stripe (ex: "le paiement a réussi", "le worker a fini son onboarding", etc.).

### 3.1 Pour tester en local (`npm run dev`)

Tu ne peux **PAS** utiliser un webhook HTTP classique parce que ton app tourne sur `localhost`, Stripe ne peut pas y envoyer de requêtes depuis internet.

**Solution : Stripe CLI** (outil en ligne de commande officiel).

**Installation Windows** :

Option A — via Scoop (recommandé, propre) :
```bash
scoop install stripe
```

Option B — téléchargement direct :
1. Va sur https://github.com/stripe/stripe-cli/releases/latest
2. Télécharge `stripe_X.X.X_windows_x86_64.zip`
3. Dézippe
4. Ajoute le dossier au PATH Windows OU déplace `stripe.exe` dans un dossier du PATH

**Vérifier l'install** :
```bash
stripe --version
# Doit afficher : stripe version X.X.X
```

### 3.2 Login Stripe CLI

```bash
stripe login
```

→ Ouvre une page navigateur → confirme dans le dashboard Stripe → revient au terminal, c'est bon.

### 3.3 Démarrer le forward webhook

Dans un terminal **séparé** (pas celui de `npm run dev`), lance :

```bash
cd "c:/Users/lezea/Documents/Site internet/Home CHR/aplication-chr-connect-main/chr-connect"
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Tu vas voir :
```
> Ready! Your webhook signing secret is whsec_abcd1234... (^C to quit)
```

→ **Copie ce `whsec_...`** (c'est différent de celui du dashboard)

### 3.4 Coller le webhook secret dans `.env.local`

Ouvre [.env.local](.env.local) et remplace la ligne existante :
```
STRIPE_WEBHOOK_SECRET=whsec_A_CONFIGURER_PLUS_TARD
```
par :
```
STRIPE_WEBHOOK_SECRET=whsec_<ton secret du stripe listen>
```

### 3.5 Redémarrer `npm run dev`

Les variables d'environnement ne sont lues qu'au démarrage. Stop + relance.

### 3.6 Laisse `stripe listen` tourner en permanence pendant les tests

Tant que le terminal avec `stripe listen` est ouvert, tous les événements Stripe seront forwardés vers ton app. Ferme-le = webhook cassé.

---

## ÉTAPE 4 — Configurer un Webhook PROD (plus tard, pas maintenant)

**À faire uniquement quand l'app sera déployée sur Vercel et pas en localhost.**

1. https://dashboard.stripe.com/test/webhooks → bouton **"Add endpoint"** en haut à droite
2. **Endpoint URL** : `https://connectchr.vercel.app/api/stripe/webhook`
3. **Events to send** : clique **"Select events"** → coche exactement ces 10 événements :
   - `account.updated`
   - `payment_intent.succeeded`
   - `payment_intent.amount_capturable_updated`
   - `payment_intent.requires_action`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `checkout.session.completed`
   - `invoice.paid`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Clique **"Add endpoint"**
5. Sur la page du webhook créé → section **Signing secret** → bouton **"Reveal"** → copie le `whsec_...`
6. Mets ce secret dans les variables d'env **Vercel** (pas `.env.local` qui sert pour le dev) :
   - Vercel Dashboard → projet → Settings → Environment Variables → `STRIPE_WEBHOOK_SECRET` = `whsec_...`

---

## ÉTAPE 5 — Tester un onboarding worker (optionnel mais utile)

Pour valider que tout est câblé :

1. Lance `npm run dev` + `stripe listen` (2 terminaux)
2. Connecte-toi en tant que prestataire sur l'app
3. Va sur `/prestataire/mon-profil` onglet **Identité**
4. Carte "Recevoir des paiements" en haut → **"Activer les paiements"**
5. Tu dois être redirigé vers une page `connect.stripe.com/setup/...`
6. Remplis l'onboarding en mode test :
   - Email : n'importe lequel
   - Téléphone : n'importe quel 06... français
   - Date naissance : > 18 ans
   - Adresse : n'importe laquelle française
   - **IBAN test France** : `FR1420041010050500013M02606` (c'est un IBAN test officiel Stripe)
   - Swift/BIC : `PSSTFRPPPAR`
   - Pour les pièces d'identité : Stripe accepte "skip" en mode test
7. Valide → redirect sur `/prestataire/mon-profil?stripe=return`
8. La carte doit être devenue **verte** "Paiements activés"
9. Terminal `stripe listen` doit avoir loggé : `--> account.updated`
10. Dans Supabase `profiles` : `stripe_account_id` rempli, `stripe_charges_enabled=true`, `stripe_payouts_enabled=true`

---

## Dépannage

**"Connect" n'apparaît nulle part dans le menu**
→ Le compte Stripe n'est peut-être pas un compte plateforme. Va sur https://dashboard.stripe.com/settings/connect/start pour forcer l'écran d'activation.

**L'onboarding Stripe renvoie "Connect is not configured for this account"**
→ L'étape 2 n'a pas été validée jusqu'au bout. Refaire le questionnaire.

**`stripe listen` erreur "cannot connect to localhost"**
→ Vérifie que `npm run dev` tourne bien sur le port 3000.

**Webhook reçu mais "signature verification failed"**
→ Le `whsec_...` dans `.env.local` ne correspond pas. Utilise celui affiché par `stripe listen`, pas celui du dashboard.

**`stripe login` pas trouvé**
→ Le binaire n'est pas dans le PATH. Relance un terminal après install ou mets le chemin complet `C:\chemin\vers\stripe.exe login`.

---

## Cartes de test à utiliser pour les paiements

| Carte | Comportement |
|---|---|
| `4242 4242 4242 4242` | Succès toujours |
| `4000 0025 0000 3155` | Nécessite 3D Secure (pop-up SMS) |
| `4000 0000 0000 9995` | Fonds insuffisants (échec) |
| `4000 0000 0000 0002` | Carte refusée (échec) |

Pour toutes : date future quelconque, CVC 3 chiffres quelconques, code postal quelconque.
