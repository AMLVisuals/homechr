

 Comptes de test — À CRÉER PAR LE TESTEUR

Le testeur crée les comptes via le signup de l'app (c'est le **premier test** à effectuer — valide le parcours d'inscription). Il doit ensuite **partager les credentials** avec le dev dans un canal privé (Slack DM, email sécurisé, 1Password partagé, etc.) pour que le dev puisse aussi s'y connecter au besoin (diagnostic, vérif data, etc.).

**Comptes à créer** :

| Rôle | Email suggéré | Remarque |
|---|---|---|
| **Patron 1** | `patron1.test@connectchr.fr` | Pour tester le côté établissement |
| **Patron 2** | `patron2.test@connectchr.fr` | Pour tester interactions multi-patrons |
| **Prestataire 1** | `presta1.test@connectchr.fr` | Remplir skills `["cuisine","extras"]` au signup |
| **Prestataire 2** | `presta2.test@connectchr.fr` | Remplir skills `["plomberie","techniciens"]` au signup |
| **Admin** | `admin@home-chr.fr` | Déjà existant dans Supabase Auth — demander le mot de passe au dev |

**Tableau à remplir et partager** (template) :

```
Patron 1  : patron1.test@connectchr.fr / <password>
Patron 2  : patron2.test@connectchr.fr / <password>
Presta 1  : presta1.test@connectchr.fr / <password>
Presta 2  : presta2.test@connectchr.fr / <password>
Admin     : admin@home-chr.fr          / <password déjà connu du dev>
```

**⚠️ Ne jamais** mettre ces credentials dans ce fichier, ni dans le repo Git, ni dans une issue publique. Uniquement dans un canal privé entre testeur et dev.

**Vérif email Supabase** : en plan free, limite de 2 emails de confirmation par heure. Le testeur peut désactiver "Confirm email" dans Supabase Auth > Settings pour accélérer les tests (à réactiver avant passage en prod).

### 4. Lancement
```bash
npm run dev
# Tester sur http://localhost:3000
# Pour tester push : installer l'app en PWA ou utiliser 2 navigateurs différents
```

---

## 🏢 INTÉGRATIONS EXTERNES — À CRÉER PAR LE RESPONSABLE LÉGAL

> Ces 3 intégrations nécessitent l'**identité légale de la société** (SIRET, représentant légal, RIB société, certificat numérique).
> Elles doivent être **créées par la personne qui gère la société ConnectCHR** — celle qui a accès aux infos KBIS, carte bancaire société, etc.
>
> Ce n'est **PAS un travail de développeur**. Le dev a préparé tout le code, il attend juste les clés API à coller dans `.env.local`.

### État actuel (2026-04-19)
| Service | Compte créé ? | Code prêt ? | Mode actuel |
|---|---|---|---|
| Yousign | ❌ À créer | ✅ | Route renvoie 503 si vide |
| PayFit | ❌ À créer | ✅ | Stub : bulletin BDD mais pas de PDF |
| URSSAF Net-Entreprises | ❌ À créer | ✅ | MOCK : 95% succès factice |

### Tâche 1 — 🟢 YOUSIGN (priorité haute, 5 min, gratuit en sandbox)

**Pourquoi** : signature électronique des contrats CDD entre patron et prestataire.

**Étapes** :
1. Aller sur https://yousign.com → **Sign up / Essai gratuit**
2. Email pro, mot de passe, nom société = `ConnectCHR`
3. Dashboard Yousign → menu **Developers** ou **API keys**
4. Créer une API key mode **Sandbox** (test, gratuit, 5 signatures/mois)
5. Copier la clé (format `ak_sandbox_xxxxxxxx`)
6. **Transmettre au dev** la clé dans un canal privé

Le dev ajoutera dans `.env.local` :
```
YOUSIGN_API_KEY=ak_sandbox_xxxxxxxx
```

Pour la **prod** (après validation MVP) : même dashboard → passer en "Production" → API key différente → transmettre au dev pour Vercel env.

**Webhook à configurer** (quand l'app sera déployée Vercel) :
- Dashboard Yousign → **Webhooks** → **Add endpoint**
- URL : `https://connectchr.vercel.app/api/contracts/webhook`
- Events à cocher : `signature_request.done`, `signer.declined`, `signature_request.expired`
- Copier le **Signing Secret** → transmettre au dev → variable `YOUSIGN_WEBHOOK_SECRET`

---

### Tâche 2 — 🔴 URSSAF Net-Entreprises (priorité haute mais délai long, ~400€/an)

**Pourquoi** : DPAE obligatoire légalement avant chaque mission STAFF.

**Étapes** :
1. Aller sur https://www.net-entreprises.fr
2. **S'inscrire en tant que tiers-déclarant** (ConnectCHR déclare pour le compte des patrons)
3. Choisir le service **DPAE - EDI/API**
4. Télécharger la convention → la faire signer par le représentant légal → renvoyer par courrier ou espace sécurisé
5. **Commander un certificat numérique X.509** chez une AC agréée :
   - ChamberSign : https://www.chambersign.fr (~220€/an)
   - Certigna : https://www.certigna.com (~260€/an)
   - Certinomis : https://www.certinomis.fr (~240€/an)
6. Une fois le certificat obtenu (papier + fichier .p12) → envoyer le certificat à Net-Entreprises pour activation
7. Délai total : **2-3 semaines**
8. Une fois activé, récupérer :
   - L'API key / clé technique
   - Le certificat au format fichier
9. **Transmettre au dev** → il configurera `URSSAF_API_KEY`, `URSSAF_SIRET`, et le certificat côté serveur

**Alternative provisoire** (en attendant les accès API) : le patron télécharge le contrat PDF généré par l'app et soumet lui-même la DPAE sur https://www.net-entreprises.fr. Standard dans le HoReCa indépendant.

---

### Tâche 3 — 🟡 PayFit (priorité moyenne, à activer quand volume > 20 missions/mois)

**Pourquoi** : génération automatique des bulletins de paie pour les prestataires extras.

**Étapes** :
1. Envoyer un email à `partners@payfit.com` avec :
   - Nom société : ConnectCHR
   - SIRET
   - Description : "Plateforme marketplace de mise en relation HoReCa + personnel extra, besoin de générer des bulletins via API pour nos clients patrons"
   - Volumétrie estimée (ex : 50 missions/mois)
2. Un commercial PayFit va recontacter (délai 3-5 jours)
3. Démo + négociation contractuelle (délai 4-8 semaines au total)
4. Une fois le contrat signé, PayFit fournit :
   - `PAYFIT_API_KEY`
   - `PAYFIT_COMPANY_ID`
5. **Transmettre au dev**

**Coût estimé** : plusieurs k€/mois en fonction du nombre de bulletins. À chiffrer avec PayFit.

**Alternative** : en attendant, le code stocke les bulletins en BDD avec calcul brut/net simple (approximation charges 22%). À long terme, passer sur PayFit ou équivalent (Silae, Lucca).

---

### Ce que le testeur/responsable légal DOIT transmettre au dev

Dans un canal privé (Slack DM, email chiffré, 1Password partagé — **jamais** dans ce repo Git) :

```
## Yousign (sandbox dans un premier temps)
YOUSIGN_API_KEY=ak_sandbox_xxxxxxxx
YOUSIGN_WEBHOOK_SECRET=whsec_xxxxxx (à fournir après config webhook)

## URSSAF (quand obtenu, peut prendre 2-3 semaines)
URSSAF_API_KEY=xxx
URSSAF_SIRET=xxxxxxxxxxxxxx
+ certificat .p12 (fichier) transmis via canal sécurisé

## PayFit (quand obtenu, peut prendre 4-8 semaines)
PAYFIT_API_KEY=xxx
PAYFIT_COMPANY_ID=xxx
```

---

### Ce que le testeur PEUT tester MAINTENANT (sans attendre les accès externes)

Toute l'app fonctionne en stub/mock pour ces 3 services. Ce qui veut dire :

✅ **Testable dès maintenant** :
- Génération du contrat CDD (HTML/PDF existant)
- Parcours DPAE côté patron (résultat simulé avec reference `MOCK-xxx`)
- Création d'un job de bulletin (enregistré en BDD avec brut/net calculés)
- Tout le reste de l'app (chat, paiement Stripe, matching, notation, litiges…)

❌ **Pas testable tant que les clés ne sont pas fournies** :
- Recevoir un vrai email Yousign avec lien de signature
- Voir un vrai AEE URSSAF sur net-entreprises.fr
- Télécharger un PDF de bulletin PayFit finalisé

Ces tests seront ajoutés en **passe n°2** une fois les clés transmises.

---

## SPRINT 0 — Quick wins visuels

### T0.1 — Marque unifiée "ConnectCHR"
- [ ] Ouvrir `/` → title onglet navigateur affiche "ConnectCHR"
- [ ] Login → h1 = "ConnectCHR"
- [ ] Sidebar patron (logo en haut) → texte = "ConnectCHR"
- [ ] Settings (roue) → footer affiche "ConnectCHR v1.0"
- [ ] Modal "Passer Premium" → "ConnectCHR Pro"
- [ ] Modal "Ajouter équipement" → texte scan mentionne "QR code ConnectCHR"
- [ ] Manifest PWA (DevTools > Application > Manifest) → name = "ConnectCHR"
- [ ] Aucune occurrence de "Home CHR" ou "CHR Connect" en user-facing

### T0.2 — Dashboard patron dynamique
**Setup** : patron avec au moins 3 missions COMPLETED dans le mois courant + ≥ 1 mission dans le mois précédent.
- [ ] Carte "Activité du mois" → affiche le **mois courant en français** (ex. "Dépensé en Avril"), PAS "Juin"
- [ ] Montant dépensé = somme réelle des `price` des missions COMPLETED du mois → pas "2450€" en dur
- [ ] Trend +X% / -X% cohérent avec la comparaison au mois précédent (green si +, red si -)
- [ ] Nombre de missions = vrai count
- [ ] Note moyenne = moyenne des `review.rating` du mois (ou "—" si aucune note)
- [ ] Section "À Venir" : top 3 missions planifiées (status SCHEDULED/ON_WAY/…) triées par date, avec **vraies** dates/heures (jour + mois FR + heure)
- [ ] Quand 0 missions planifiées → empty state "Aucune mission planifiée" + bouton "Créer une demande"

### T0.3 — Bannière bienvenue dismissible
- [ ] Login patron neuf (0 missions) → bannière "Bienvenue sur ConnectCHR" visible
- [ ] Bouton X en haut à droite de la bannière → clic → bannière disparaît
- [ ] Rafraîchir la page → bannière reste fermée (persistée en `localStorage`)
- [ ] Effacer localStorage + rafraîchir → bannière réapparaît

---

## SPRINT 1 — Fondations temps réel

### T1.1 — Notation croisée persistée
**Setup** : mission en status COMPLETED avec provider assigné, les 2 côtés connectés.
- [ ] Côté patron : ouvrir mission COMPLETED → bouton "Noter la prestation" visible
- [ ] Clic → modal s'ouvre avec étoiles cliquables
- [ ] Choisir 4 étoiles + commentaire → "Envoyer mon avis"
- [ ] Si le prestataire n'a PAS encore noté → écran "En attente de l'avis du prestataire" (Clock icon, texte bleu)
- [ ] Fermer, vérifier dans Supabase : table `mission_reviews` contient 1 row avec reviewer_id=patron, reviewee_id=provider, rating=4
- [ ] Le prestataire soumet son avis côté worker (TODO: UI worker à venir)
- [ ] Rouvrir modal patron → s'il y a les 2 avis, écran "Avis croisés" révélant rating+commentaire des deux
- [ ] Erreur réseau pendant submit → message rouge "Impossible d'enregistrer l'avis", pas de duplicate

### T1.2 — Chat Supabase Realtime (côté patron)
**Setup** : mission avec provider assigné, 2 navigateurs (patron et worker).
- [ ] Ouvrir mission côté patron → bloc provider → bouton "Message" cliquable
- [ ] Clic → modal chat s'ouvre, affiche nom + avatar + titre mission
- [ ] Premier ouverture : empty state "Démarrez la conversation"
- [ ] Taper message + Enter → envoi instantané, apparaît à droite en bleu
- [ ] Taper Shift+Enter → nouvelle ligne (pas envoi)
- [ ] Ouvrir le même thread côté worker (via chat côté prestataire — pas encore implémenté, tester plutôt via insertion manuelle Supabase ou attendre Sprint 1 bis)
- [ ] Vérifier Supabase : table `message_threads` a 1 row pour cette mission, `messages` contient les messages envoyés
- [ ] Timestamp affiché sous chaque message (HH:MM)
- [ ] Scroll auto vers le bas à l'ouverture et à chaque nouveau message
- [ ] Si le Service Worker n'est pas actif / Realtime cassé → pas de crash, le bouton d'envoi reste fonctionnel

### T1.3 — Notifications push (infrastructure)
**Setup** : `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local`, serveur redémarré. Navigateur Chrome/Edge/Firefox récent (pas Safari iOS < 16.4).
- [ ] Ouvrir **Paramètres** (roue) → section Notifications → toggle "Notifications push"
- [ ] État initial = "Désactivées"
- [ ] Clic sur toggle → popup navigateur demande la permission
- [ ] Accepter → toggle devient bleu, état = "Activées sur cet appareil"
- [ ] Vérifier Supabase : table `push_subscriptions` contient 1 row pour cet user (endpoint, p256dh, auth, user_agent)
- [ ] Refuser popup → toggle reste off, état = "Bloqué dans les réglages du navigateur", toggle désactivé
- [ ] Cliquer à nouveau sur le toggle activé → désinscription, toggle devient gris, row supprimée dans Supabase
- [ ] Tester navigateur non supporté (ex. Safari iOS 15) → état = "Non supporté par ce navigateur", toggle grisé

### T1.4 — Push notif sur message chat
**Setup** : worker a activé le push, patron envoie un message.
- [ ] Patron ouvre chat avec worker → envoie "Bonjour, à demain 9h"
- [ ] Worker (autre navigateur, même ONGLET FERMÉ ou en arrière-plan) reçoit une notif système "<Prénom patron>" / "Bonjour, à demain 9h"
- [ ] Clic sur notif → ouvre l'app sur `/patron/missions` (ou devrait idéalement ouvrir le thread — à améliorer)
- [ ] Message > 120 caractères → body tronqué avec "…"

---

## SPRINT 2 — Matching temps réel

### T2.1 — Realtime côté prestataire
**Setup** : 1 patron + 2 prestataires connectés dans 3 navigateurs différents.
- [ ] Prestataire A ouvre onglet "Rechercher" → aucune mission
- [ ] Patron crée une nouvelle mission SEARCHING avec skills (ex. `["cuisine", "extras"]`)
- [ ] Prestataire A **voit la mission apparaître automatiquement** sans refresh (< 2s)
- [ ] Prestataire B idem
- [ ] Patron annule la mission → elle disparaît des 2 listes prestataires en direct

### T2.2 — Push aux workers matchés
**Setup** : prestataire A a skill `"cuisine"`, prestataire B a skill `"plomberie"`, les 2 ont activé push. Patron crée une mission avec skills `["cuisine"]`.
- [ ] Prestataire A reçoit une notif push "Nouvelle mission" (titre mission)
- [ ] Prestataire B ne reçoit **pas** de push (skill non matchée)
- [ ] Si la mission est `urgent: true` → push prefix "⚡ Urgent — …" et `requireInteraction: true` (notif reste jusqu'à interaction)
- [ ] Clic sur notif → ouvre `/prestataire/mes-missions`

### T2.3 — Realtime côté patron
**Setup** : patron a ouvert le modal de sa mission SEARCHING.
- [ ] Prestataire A postule → patron voit la candidature apparaître **sans refresh** dans l'onglet Candidatures du modal
- [ ] Prestataire B postule → même comportement, liste se met à jour
- [ ] Prestataire A annule sa candidature → disparaît côté patron en direct

### T2.4 — Push patron sur candidature
**Setup** : patron a activé push.
- [ ] Prestataire A postule → patron reçoit une notif "Nouvelle candidature / \<Nom prestataire\> souhaite rejoindre \"\<Titre mission\>\""
- [ ] Clic notif → ouvre `/patron/missions`

### T2.5 — Acceptation candidat + push
**Setup** : plusieurs candidats sur une mission, patron choisit l'un.
- [ ] Patron clique "Choisir" sur un candidat → candidat passe en "ACCEPTED"
- [ ] Mission passe en status SCHEDULED
- [ ] Le candidat choisi (s'il a push activé) reçoit "Candidature acceptée ✅ / Vous êtes retenu pour \"\<Titre\>\""
- [ ] Notif a `requireInteraction: true` (reste jusqu'à clic)
- [ ] Clic → ouvre `/prestataire/mes-missions`

---

---

## SPRINT 3 — Stripe Connect marketplace

> **Pré-requis Stripe** (à faire en amont par l'équipe dev/ops, pas par le testeur) :
> 1. Dans Stripe Dashboard (mode test) → Settings → Connect → **Enable Connect**
> 2. Activer **Express accounts** (platform accounts)
> 3. Branding : logo, nom plateforme "ConnectCHR"
> 4. Webhook endpoint à créer : `https://<url>/api/stripe/webhook`
>    - Events à écouter : `account.updated`, `payment_intent.succeeded`, `payment_intent.amount_capturable_updated`, `payment_intent.requires_action`, `payment_intent.payment_failed`, `charge.refunded`, `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`, `invoice.payment_failed`
>    - Copier le `whsec_...` → `.env.local` `STRIPE_WEBHOOK_SECRET`
> 5. Tests avec Stripe test cards : `4242 4242 4242 4242` (succès), `4000 0025 0000 3155` (3DS requis), `4000 0000 0000 9995` (insufficient funds)

### T3.1 — Onboarding Connect côté prestataire
**Setup** : compte prestataire neuf, sans `stripe_account_id` en base.
- [ ] Ouvrir `/prestataire/mon-profil` → onglet **Identité**
- [ ] En haut de la page : carte "Recevoir des paiements" avec bouton **"Activer les paiements"**
- [ ] Clic → redirect vers page hébergée Stripe (URL commence par `https://connect.stripe.com/setup/...`)
- [ ] Remplir l'onboarding (en mode test Stripe : cocher cases + fake data, ajouter IBAN test FR `FR1420041010050500013M02606`)
- [ ] Finaliser → retour sur `/prestataire/mon-profil?stripe=return`
- [ ] Carte affiche maintenant "Paiements activés" (vert) avec icône check
- [ ] Vérifier Supabase `profiles` : `stripe_account_id` renseigné, `stripe_charges_enabled=true`, `stripe_payouts_enabled=true`, `stripe_details_submitted=true`

### T3.2 — Onboarding interrompu
- [ ] Compte neuf, clic "Activer les paiements", **fermer la page Stripe avant la fin**
- [ ] Revenir sur `/prestataire/mon-profil` → la carte doit afficher "Vérification en cours" (orange) + bouton "Compléter mon dossier"
- [ ] Liste des `requirementsDue` visible (ex. "external account", "document front")
- [ ] Clic sur "Compléter mon dossier" → renvoie sur l'onboarding Stripe pour finir

### T3.3 — Préautorisation du paiement (patron)
**Setup** : mission SCHEDULED avec provider Stripe-actif, patron avec carte de test.
- [ ] Côté patron, ouvrir la mission SCHEDULED
- [ ] Bloc provider : **bouton bleu "Préautoriser le paiement (X.XX €)"** visible
- [ ] Clic → modal s'ouvre avec décomposition : montant prestataire + frais plateforme 15% + total
- [ ] Message "Les fonds seront bloqués… prélevés qu'après validation"
- [ ] Saisir carte `4242 4242 4242 4242`, date future, CVC `123` → "Confirmer et bloquer"
- [ ] Écran succès "Paiement préautorisé" → modal se ferme après 1.5s
- [ ] Mission affiche badge bleu "X.XX € bloqués — transfert au prestataire à la validation"
- [ ] Vérifier Supabase `missions` : `stripe_payment_intent_id`, `payment_status='AUTHORIZED'`, `authorized_amount`, `platform_fee_amount`
- [ ] Vérifier Stripe dashboard (Payments) : un PaymentIntent en `requires_capture` avec application_fee + transfer_data.destination

### T3.4 — Échec de préautorisation
- [ ] Tenter avec carte `4000 0000 0000 9995` (insufficient funds)
- [ ] Message d'erreur rouge "Le paiement a échoué / fonds insuffisants"
- [ ] Mission reste sans `payment_status` AUTHORIZED
- [ ] Retenter avec une bonne carte → doit fonctionner

### T3.5 — Préautorisation sans compte Connect du worker
- [ ] Patron tente préautorisation sur mission avec worker qui n'a PAS activé ses paiements Stripe
- [ ] Erreur "Le prestataire doit compléter son onboarding Stripe avant de recevoir des paiements"
- [ ] Aucun PaymentIntent créé

### T3.6 — Capture du paiement (mission terminée)
**Setup** : mission avec `payment_status=AUTHORIZED`, passer au status `COMPLETED`.
- [ ] Passer la mission en COMPLETED
- [ ] Ouvrir la mission : bouton vert **"Libérer le paiement (X.XX €)"** visible
- [ ] Clic → loader → devient "Paiement transféré au prestataire"
- [ ] Vérifier Supabase : `payment_status='CAPTURED'`, `captured_amount` renseigné, `captured_at` daté
- [ ] Stripe dashboard : le PaymentIntent passe en `succeeded`, la commission plateforme apparaît dans Applications fees
- [ ] Côté compte Connect du worker (Stripe dashboard > Connected accounts > [worker]) : Balance augmentée du montant net

### T3.7 — Annulation libère la préauto (patron change d'avis)
**Setup** : mission avec `payment_status=AUTHORIZED`, appel manuel à `/api/stripe/payment/release` (pas de bouton UI pour l'instant — sera ajouté).
- [ ] POST `/api/stripe/payment/release` avec `{ missionId }`
- [ ] Supabase : `payment_status='RELEASED'`
- [ ] Stripe : PaymentIntent `canceled`
- [ ] Aucun débit effectif sur la carte patron

### T3.8 — Webhook + idempotence
- [ ] Vérifier que le webhook reçoit bien les événements (Stripe dashboard > Developers > Webhooks > voir les deliveries)
- [ ] Table Supabase `stripe_events` : 1 row par événement reçu (unique sur `stripe_event_id`)
- [ ] `processed=true` après traitement réussi
- [ ] Si Stripe renvoie le même event (retry) → la route retourne `{duplicate: true}` sans re-traiter

### T3.9 — Mission urgente majoration (rappel Sprint 2, lié)
- [ ] Le prix "final" utilisé pour la préauto doit refléter l'éventuelle majoration urgente (15%+ si activée côté business)
- [ ] La commission plateforme reste 15% du total

### T3.10 — Bugs connus Sprint 3
- Le bouton "Libérer le paiement" s'affiche uniquement si `payment_status='AUTHORIZED'` et `status='COMPLETED'` — si l'un des deux manque, il n'apparaît pas
- Pas de UI pour annulation côté patron (release) — call API manuel requis
- Pas de UI patron pour consulter l'historique des paiements (à faire Sprint 4)
- Reversement au worker = géré par Stripe payout schedule (par défaut standard France = 7j ; à configurer manuellement en mode "daily" pour "48h" promis au prestataire)
- Webhook en dev : utiliser `stripe listen --forward-to localhost:3000/api/stripe/webhook` pour avoir le `whsec_...` local

---

---

## SPRINT 5 — Confiance

### T5.1 — Ouvrir un litige (côté patron)
**Setup** : mission COMPLETED avec provider assigné.
- [ ] Ouvrir la mission côté patron → bouton rouge "Signaler un problème" visible (sous le bloc review)
- [ ] Clic → modal s'ouvre, liste des motifs (NO_SHOW, QUALITY_ISSUE, DAMAGE, LATE_ARRIVAL, UNPROFESSIONAL, BILLING_DISPUTE, INCOMPLETE_WORK, OTHER)
- [ ] Le motif NO_SHOW a un liseré rouge + badge "Mission de remplacement gratuite"
- [ ] Sélectionner un motif → passage à l'étape Détails
- [ ] Saisir description + ajouter 1-2 photos → bouton "Envoyer le signalement"
- [ ] Loader pendant l'envoi → écran de succès "Signalement enregistré"
- [ ] Vérifier Supabase `mission_disputes` : 1 row avec mission_id, reason, description, photos, status='OPEN'
- [ ] Vérifier Supabase `missions` : la mission passe en status='DISPUTED'
- [ ] Si le worker a activé push → il reçoit une notif "Litige ouvert / Un signalement a été déposé sur \"X\""
- [ ] Le patron aussi reçoit la notif (car il est l'initiateur mais /api/missions/notify-dispute push aux 2 parties)

### T5.2 — Erreur réseau pendant ouverture litige
- [ ] Désactiver le wifi puis soumettre → message rouge "Erreur serveur" ou équivalent
- [ ] La mission ne passe PAS en DISPUTED si l'insert Supabase a échoué
- [ ] Réactiver réseau + retenter → succès

### T5.3 — Modération chat : masquage numéro de téléphone
**Setup** : chat ouvert entre patron et worker.
- [ ] Envoyer un message : `Appelle-moi au 06 12 34 56 78 stp`
- [ ] Le message reçu par l'autre partie affiche : `Appelle-moi au [numéro masqué] stp`
- [ ] Côté expéditeur : toast orange en haut de la zone d'input "Partage de coordonnées externes masqué…" (visible 4s)
- [ ] Vérifier Supabase `messages.body` : contient la version masquée, pas l'original

### T5.4 — Modération chat : masquage email
- [ ] Envoyer : `mon email c'est jean.dupont@gmail.com`
- [ ] Affichage : `mon email c'est [email masqué]`
- [ ] Toast modération visible

### T5.5 — Modération chat : apps externes
- [ ] Envoyer : `on se parle sur WhatsApp ou Telegram plutôt`
- [ ] Affichage : `on se parle sur [application masquée] ou [application masquée] plutôt`
- [ ] Toast modération visible

### T5.6 — Pas de faux positif sur message normal
- [ ] Envoyer : `Parfait, à demain 9h à l'adresse habituelle`
- [ ] Message passe **sans modification** et sans toast
- [ ] Même chose pour un prix : `Le tarif est de 150€ net`

### T5.7 — Badge "Identité vérifiée" côté patron
**Setup** : 2 candidats sur une mission
- A : a complété son onboarding Stripe Connect (T3.1)
- B : n'a PAS complété Stripe
- [ ] Ouvrir la mission côté patron → onglet Candidatures
- [ ] Candidat A affiche badge bleu **"Vérifié"** avec icône bouclier (à côté du nom)
- [ ] Candidat B n'a PAS le badge
- [ ] Hover sur le badge → tooltip "Identité vérifiée (Stripe KYC)"

### T5.8 — Bugs connus Sprint 5
- **Pas d'UI worker pour ouvrir un litige** : seul le patron peut signaler un problème depuis MissionDetailsModal. Les litiges côté worker doivent passer par le support manuel. UI à ajouter Sprint suivant.
- **Modération chat côté client** : un utilisateur pourrait bypass en modifiant le JS. OK en MVP. Pour production : dupliquer la modération dans une DB function Postgres sur INSERT.
- **Pas de workflow de médiation intégré** : actuellement status='OPEN' reste OPEN, aucun admin ne peut passer à UNDER_REVIEW/RESOLVED via l'UI. À faire.
- **Pas de remboursement auto** : en cas de litige résolu en faveur du patron, pas de bouton "Rembourser" (appel manuel à Stripe requis).
- **Pas de "blacklist réciproque"** côté patron/worker après litige.

---

---

## SPRINT 6 — Différenciateurs (partiel)

### T6.1 — Export .ics du planning
**Setup** : patron avec au moins 3 missions ayant une `scheduledDate` ou `date`.
- [ ] Ouvrir le tab **Planning**
- [ ] Bouton **"Exporter"** (icône download) visible en haut à droite, à côté du filtre
- [ ] Clic → téléchargement d'un fichier `connectchr-planning.ics`
- [ ] Ouvrir le fichier dans un éditeur de texte : doit commencer par `BEGIN:VCALENDAR` et contenir un `BEGIN:VEVENT` par mission, avec `DTSTART`, `DTEND`, `SUMMARY`, `DESCRIPTION`
- [ ] Double-clic sur le .ics → doit ouvrir dans le calendrier par défaut (Google Calendar import, Outlook, Apple Calendar)
- [ ] Les missions apparaissent avec bonne date/heure/durée (120min par défaut si pas d'`estimatedDuration`)
- [ ] Le SUMMARY = titre mission, DESCRIPTION contient prestataire + tarif + statut, LOCATION = adresse/venue
- [ ] Si aucune mission planifiée → bouton Exporter grisé (disabled)

### T6.2 — Mode offline renforcé
**Setup** : navigateur Chrome/Edge, l'app a été chargée en ligne au moins une fois.
- [ ] DevTools > Application > Service Workers → vérifier que `sw.js` est actif et à jour (`connectchr-static-v3`, `connectchr-dynamic-v3`)
- [ ] DevTools > Network → cocher **Offline**
- [ ] Rafraîchir la page `/` → affiche la version cache (pas d'erreur "You're offline")
- [ ] Naviguer vers `/patron/equipements` → fonctionne (précaché)
- [ ] Naviguer vers `/patron/planning` → fonctionne
- [ ] Les images/fonts/JS sont servis depuis cache-first, pas de 404
- [ ] Remettre online → tout se remet à jour normalement

### T6.3 — Cache propre (pas de cache API)
- [ ] Offline : essayer de créer une mission → échoue (normal, car API non cachée)
- [ ] Les réponses Supabase et Stripe ne sont JAMAIS cachées (données sensibles, session-specific)

### T6.4 — Bugs connus / reporté Sprint 6
- **Drag-drop missions dans planning** : non implémenté — nécessite lib `@dnd-kit/core` + refactor du PlanningTab. Reporté Sprint 7+.
- **Vue jour/semaine** : planning uniquement vue mois. Vue jour/semaine à ajouter.
- **Détection conflits d'agenda** : pas en place (2 missions même heure = pas d'alerte).
- **Devis maintenance UI patron** : [quote-intelligence](src/lib/quote-intelligence/) prêt côté worker, mais patron n'a pas encore l'UI pour valider un devis reçu. À faire.
- **Mode offline sur données** : les données (missions, candidatures, équipements) viennent de Supabase (bypassées par le SW). Pour un vrai offline des données : IndexedDB + sync différée — gros chantier, non MVP.

---

---

## SPRINT 7 — Prod readiness (partiel)

### T7.1 — Prévision masse salariale (dashboard patron)
**Setup** : patron avec missions COMPLETED et SCHEDULED dans le mois courant.
- [ ] Dashboard patron → colonne droite → carte **"Prévision fin de mois"** visible (en-dessous "Activité du mois")
- [ ] Gros chiffre = total projeté = `déjà dépensé + engagé`
- [ ] Breakdown visible : "Déjà dépensé" + "Engagé (missions à venir)" + "Coût moyen / mission"
- [ ] Si aucune mission engagée/complétée ce mois → carte **non affichée** (pas de bloc vide)
- [ ] Chiffres cohérents : la somme déjà dépensée match la carte "Activité du mois"

### T7.2 — Annulation préautorisation
**Setup** : mission SCHEDULED avec `payment_status='AUTHORIZED'`.
- [ ] Ouvrir la mission côté patron → sous le badge "X.XX € bloqués" → bouton **"Annuler la préautorisation"** (gris avec X)
- [ ] Clic → `confirm()` natif du navigateur "Annuler la préautorisation ? Les fonds seront libérés..."
- [ ] OK → loader → mission passe à `payment_status='RELEASED'`
- [ ] Stripe dashboard : le PaymentIntent est en `canceled`
- [ ] Aucun débit sur la carte patron
- [ ] Si mission en ON_WAY/ON_SITE/COMPLETED → bouton n'apparaît PAS (trop tard pour libérer)

### T7.3 — Micro-restants / bugs connus Sprint 7
- **Chat côté prestataire** : toujours pas de bouton "Contacter le patron" côté worker (besoin de refactor mission-sheet côté worker).
- **2FA (TOTP)** : non implémenté. À activer via Supabase Auth (Settings > Authentication > MFA) + ajouter UI enrollment dans Settings.
- **Accessibilité WCAG AA** : non audité. Contrastes non vérifiés, labels ARIA incomplets.
- **Charte couleur rationalisée** (rapport AML §3.2.5) : reporté.
- **Header simplifié** (rapport AML §3.2.2) : reporté.
- **Drag-drop planning** : reporté.
- **Analytics benchmark anonymisé** : reporté (nécessite data de plusieurs établissements).

---

---

## SPRINT 4 — Contractualisation légale (stubs plug-and-play)

> **Important** : les 3 intégrations légales (Yousign, PayFit, URSSAF Net-Entreprises) nécessitent des accès API sur onboarding long.
> Le code tourne en **mode STUB/MOCK** tant que les clés ne sont pas renseignées dans `.env.local`.
>
> | Intégration | Délai d'obtention | Contact |
> |---|---|---|
> | **Yousign** sandbox | immédiat (signup gratuit) | https://app.yousign.com |
> | **Yousign** prod | 1-2 semaines (vérification entreprise) | idem |
> | **PayFit** API partenaire | 4-8 semaines | partners@payfit.com |
> | **URSSAF** Net-Entreprises | 2-3 semaines | convention + certificat X.509 |

### T4.1 — Signature Yousign (mode stub si YOUSIGN_API_KEY vide)
**Setup** : `YOUSIGN_API_KEY` **vide** dans `.env.local`.
- [ ] Appeler l'API `POST /api/contracts/sign` avec un `contractId` valide
- [ ] Réponse doit être une erreur **503** : "Yousign non configuré (YOUSIGN_API_KEY manquant dans .env.local)"
- [ ] Aucune mutation en BDD (signature_status reste 'DRAFT')

### T4.2 — Signature Yousign (mode réel, sandbox)
**Setup** :
1. Créer un compte Yousign sandbox : https://app.yousign.com → signup
2. Dashboard Yousign → **Developers** → créer une API key sandbox
3. Copier la clé dans `.env.local` : `YOUSIGN_API_KEY=xxx`
4. Redémarrer `npm run dev`

- [ ] Déclencher une signature via `POST /api/contracts/sign` avec body : `{contractId, pdfBase64}`
  - `pdfBase64` = un PDF encodé en base64 (utiliser le contrat généré existant)
- [ ] Réponse 200 avec `{signatureRequestId, patronSignLink, workerSignLink}`
- [ ] BDD `dpae_contracts` : `signature_status='SENT'`, `yousign_request_id` rempli, `sent_at` daté
- [ ] Email Yousign reçu par le patron ET le worker (emails réels)
- [ ] Lien → page signature Yousign → signer avec code OTP SMS si phone fourni
- [ ] Quand les 2 ont signé → webhook `/api/contracts/webhook` appelé par Yousign
- [ ] BDD `dpae_contracts` : `signature_status='SIGNED'`, `signed_at`, `signed_pdf_url` renseignés
- [ ] PDF signé téléchargeable depuis Supabase Storage bucket `documents`
- [ ] Les 2 parties reçoivent une push "Contrat signé ✅"

### T4.3 — Refus de signature (Yousign)
- [ ] Un signataire refuse la signature dans Yousign → webhook `signer.declined`
- [ ] BDD `dpae_contracts.signature_status='DECLINED'`
- [ ] Pas de PDF stocké

### T4.4 — DPAE URSSAF (mode MOCK par défaut)
**Setup** : `URSSAF_API_KEY` vide (normal à ce stade).
- [ ] Ouvrir une mission STAFF côté patron → onglet DPAE
- [ ] Remplir le formulaire DPAE existant → Soumettre
- [ ] Tourne en mode MOCK : 95% succès / 5% fake error
- [ ] BDD `dpae_declarations` : `status='VALIDATED'`, `submission_mode='MOCK'`, `urssaf_reference='MOCK-xxx'`
- [ ] La mission se débloque (`mission_unlocked=true`) si précédemment verrouillée

### T4.5 — DPAE URSSAF (mode réel, quand configuré)
**Setup** : clés URSSAF obtenues via convention Net-Entreprises + certificat X.509 + `URSSAF_API_KEY` + `URSSAF_SIRET` dans `.env.local`.
- [ ] Même flow qu'en T4.4 mais `submission_mode='API_NET_ENTREPRISES'`
- [ ] Le `urssaf_reference` = vrai AEE URSSAF (format `XXXXX-XXXXXXXX`)
- [ ] Vérifier la déclaration sur https://www.net-entreprises.fr avec le SIRET employeur

### T4.6 — Bulletins PayFit (mode STUB par défaut)
**Setup** : `PAYFIT_API_KEY` vide.
- [ ] Après validation de la mission (actualHoursWorked rempli), appeler `POST /api/payroll/generate` avec `{missionId, hourlyRateGross}`
- [ ] Réponse 200 avec `{jobId, externalId: null, mode: 'STUB', configured: false}`
- [ ] BDD `payslip_jobs` : 1 row avec `provider='PAYFIT'`, `status='PENDING'`, `gross_amount`, `net_amount` calculés (brut = h × taux ; net ≈ brut × 0.78)
- [ ] Aucun PDF généré pour l'instant (stub uniquement)

### T4.7 — Bulletins PayFit (mode réel, quand partenariat actif)
**Setup** : `PAYFIT_API_KEY` + `PAYFIT_COMPANY_ID` dans `.env.local`.
- [ ] Même appel → réponse `mode='PAYFIT_API'`, `externalId=<PayFit ID>`
- [ ] BDD : `status='PROCESSING'`
- [ ] Polling via `pollPayslipJob(jobId)` jusqu'à status='READY' et `payslip_pdf_url` rempli
- [ ] Le PDF est téléchargeable par le worker depuis son profil

### T4.8 — Bugs connus / limitations Sprint 4
- **Pas d'UI patron pour déclencher la signature Yousign** : l'API `/api/contracts/sign` existe mais aucun bouton dans MissionDetailsModal → à ajouter. L'utilisateur doit appeler l'API via Postman ou console dev pour tester.
- **Pas d'UI patron pour déclencher `/api/payroll/generate`** : même chose, à ajouter sur PayslipsTab.
- **Bucket Storage `documents`** : doit exister dans Supabase Storage (vérifier Settings → Storage → bucket `documents` accessible en write par service_role). Si absent, créer manuellement.
- **Webhook Yousign** : l'URL à renseigner côté Yousign dashboard = `https://<ton-domaine>/api/contracts/webhook`. En local, utiliser ngrok ou tester via sandbox events manuellement.
- **Signature Yousign mode sandbox** : les emails et SMS sont réels mais en mode test. Les numéros doivent être vrais pour OTP SMS.
- **Stubs PayFit** : `net_amount` est une approximation (brut × 0.78). Les vrais calculs HCR CCN (mutuelle, CSG/CRDS, etc.) ne sont pas encore faits → PayFit le fera en mode API_REEL.
- **Génération PDF du contrat à signer** : l'API `/api/contracts/sign` attend un `pdfBase64`, mais actuellement le contrat est généré en **HTML** par `generateContractHTML`. Il faut soit convertir HTML→PDF côté client (jsPDF/html2pdf), soit ajouter une lib `puppeteer` côté serveur. TODO.

---

---

## TODOs complétés (2026-04-20)

### T-TODO.1 — Chat côté prestataire
**Setup** : worker avec mission SCHEDULED (candidature acceptée par patron).
- [ ] Ouvrir la mission côté prestataire (MissionSheet)
- [ ] Bouton **"Contacter le patron"** (icône message) visible au-dessus de "Partager/Accepter"
- [ ] Visible uniquement pour missions status SCHEDULED / ON_WAY / ON_SITE / IN_PROGRESS / PENDING_VALIDATION
- [ ] Invisible pour missions SEARCHING ou COMPLETED / CANCELLED
- [ ] Clic → modal chat s'ouvre avec nom du patron (= venue name), thread correct
- [ ] Envoi de message → push notif au patron (si push activé)
- [ ] Réception en direct côté patron sans refresh

### T-TODO.2 — Signature électronique Yousign (UI patron)
**Setup** : DPAE complétée jusqu'à l'étape "done" + `YOUSIGN_API_KEY` configurée.
- [ ] Dans le wizard DPAE, écran "DPAE envoyée !" → section **"Envoyer pour signature électronique"** visible
- [ ] Clic → état "Génération du PDF..." (conversion HTML→PDF via jsPDF + html2canvas)
- [ ] Puis "Envoi à Yousign..." (upload PDF + création signature_request)
- [ ] Succès → message vert "Contrat envoyé pour signature"
- [ ] Les 2 parties reçoivent un email Yousign
- [ ] Vérifier Supabase `dpae_contracts` : `signature_status='SENT'`, `yousign_request_id` rempli, `sent_at` daté
- [ ] Si `YOUSIGN_API_KEY` vide → erreur 503 affichée, état "Erreur"

### T-TODO.3 — Génération bulletin PayFit (UI patron)
**Setup** : mission STAFFING en status COMPLETED avec `actualHoursWorked` renseigné.
- [ ] Ouvrir la mission → bouton **"Générer le bulletin de paie"** (icône FileText) visible sous les actions review/litige
- [ ] Clic → loader → bannière verte "Bulletin généré (mode test)" si PAYFIT_API_KEY vide
- [ ] Vérifier Supabase `payslip_jobs` : 1 row avec mission_id, provider='PAYFIT', status='PENDING', hours_worked, gross_amount, net_amount
- [ ] Si `PAYFIT_API_KEY` configurée → `status='PROCESSING'` et `external_id` rempli

### T-TODO.4 — PDF téléchargeable du contrat CDD
**Setup** : DPAE soumise, accès à l'écran "done" du wizard.
- [ ] Bouton **"Télécharger PDF"** (remplace l'ancien "Télécharger HTML")
- [ ] Clic → téléchargement d'un **vrai .pdf** (pas .html)
- [ ] Ouvrir le PDF → mise en page propre, conservation des styles
- [ ] Pages multiples si contrat long (split automatique)

### T-TODO.5 — Statut paiement dans liste missions
- [ ] Dans l'onglet **Missions** côté patron, chaque mission affiche :
  - Son prix
  - Son statut (En cours / Acceptée / etc.)
  - **Un nouveau badge de paiement** en plus (💳 Bloqué / ✓ Payé / Libéré / Remboursé / Échec)
- [ ] Le badge n'apparaît PAS pour les missions sans paiement initié (status NONE/absent)

---

## Sprint 5 — Workflow admin litiges + refund Stripe (2026-04-20)

### T-S5.1 — Accès à l'onglet Litiges
**Setup** : migration `supabase-schema-sprint5.sql` appliquée, se connecter sur `/admin/tableau-de-bord` avec admin@home-chr.fr.
- [ ] Un nouvel onglet **"Litiges"** (icône alerte) apparaît dans la sidebar admin entre "Utilisateurs" et "Abonnements".
- [ ] Clic → redirige vers `/admin/litiges`
- [ ] La page affiche 4 stat cards (Ouverts / En examen / Résolus / Total remboursé)
- [ ] Barre de filtres (Tous / Ouverts / En examen / Résolus patron / Résolus prestataire / Clôturés)
- [ ] Barre de recherche fonctionnelle (filtre sur titre mission, patron, prestataire, description)

### T-S5.2 — Listing des litiges réels
**Pré-requis** : ouvrir au moins 1 litige côté patron (mission COMPLETED → bouton "Signaler un problème" dans MissionDetailsModal).
- [ ] Le litige ouvert apparaît dans la liste admin en statut "Ouvert"
- [ ] Carte affiche : titre mission, motif, nom patron, nom prestataire, date de création, badge statut
- [ ] Cliquer sur la carte → ouvre la modale de résolution

### T-S5.3 — Modale "Résoudre le litige"
- [ ] Header : titre + nom mission
- [ ] Champs affichés : Patron, Prestataire, Motif, Statut paiement
- [ ] Section **"Description du signalement"** : texte + photos si présentes (cliquables → ouvre full-size dans nouvel onglet)
- [ ] Zone textarea **"Note interne / résolution"** éditable
- [ ] Si paiement CAPTURED ou PENDING : section verte **"Remboursement Stripe"** avec input montant (pré-rempli avec le montant capturé)
- [ ] Checkbox **"Ajouter à la blacklist réciproque"**
- [ ] 4 boutons d'action en bas : En examen / Patron / Prestataire / Clôturer

### T-S5.4 — Passer en examen
- [ ] Cliquer **"En examen"** → la modale se ferme
- [ ] Le statut du litige passe à `UNDER_REVIEW` (badge orange "En examen")
- [ ] Patron + prestataire reçoivent une notification push *"Litige en cours d'examen"*

### T-S5.5 — Résolu en faveur du patron + refund Stripe (test critique)
**Setup critique** : mission avec `payment_status = CAPTURED` (il faut donc avoir fait la chaîne complète : préauto → capture côté patron avant de signaler).
- [ ] Dans la modale, renseigner note interne + montant refund (ex: montant complet)
- [ ] Cliquer **"Patron"** → la modale se ferme après 1-2s
- [ ] Le litige passe au statut `RESOLVED_PATRON`
- [ ] Badge vert **"✓ Remboursé XX€"** apparaît sur la carte du litige
- [ ] Côté patron : mission passe en statut CANCELLED
- [ ] Côté Stripe dashboard : un **Refund** est visible sur le PaymentIntent (avec `reverse_transfer`)
- [ ] Patron reçoit push *"Litige résolu en votre faveur (remboursement XX€)"*
- [ ] Prestataire reçoit aussi la notification

### T-S5.6 — Résolu en faveur du prestataire
- [ ] Ouvrir un litige, cliquer **"Prestataire"**
- [ ] Status passe à `RESOLVED_PROVIDER` (badge bleu)
- [ ] **Aucun refund Stripe déclenché** (les fonds restent au prestataire)
- [ ] Mission passe en statut COMPLETED
- [ ] Les 2 parties reçoivent push

### T-S5.7 — Clôture sans décision
- [ ] Ouvrir un litige, cliquer **"Clôturer"**
- [ ] Statut passe à `CLOSED` (badge gris)
- [ ] Les 2 parties reçoivent push

### T-S5.8 — Refund sur paiement non-capturé (préauto uniquement)
**Setup** : mission avec `payment_status = PENDING` ou `AUTHORIZED`.
- [ ] Résoudre en faveur patron
- [ ] Le PaymentIntent est **annulé** (pas un refund au sens strict) — `payment_status` passe à `RELEASED`
- [ ] Badge vert "Remboursé" apparaît avec le montant autorisé

### T-S5.9 — Cas d'erreur refund
**Setup** : si possible, forcer un état où le PaymentIntent est invalide (test sandbox).
- [ ] Le litige est quand même résolu mais badge **"⚠ Refund échoué"** apparaît
- [ ] La raison de l'erreur est ajoutée aux admin_notes
- [ ] Le dev peut ensuite refaire le refund manuellement via Stripe dashboard

### T-S5.10 — Blacklist réciproque
- [ ] Résoudre un litige en cochant **"Ajouter à la blacklist"**
- [ ] Vérifier dans Supabase table `user_blacklist` : 2 lignes créées (patron→worker et worker→patron)
- [ ] Les 2 parties peuvent toujours voir l'historique mais ne peuvent plus candidater/être matchés (à vérifier sur le flux de candidature si implémenté — sinon c'est juste de la donnée)

### T-S5.11 — Sécurité API
- [ ] Tenter d'appeler `GET /api/admin/disputes` **sans token** → 403 "Token requis"
- [ ] Tenter avec un token de **patron non-admin** → 403 "Accès réservé aux admins"
- [ ] Seul un profil avec `is_admin = true` doit pouvoir accéder

### T-S5.12 — Role SUPPORT
**Setup** : se connecter avec un compte staff de rôle SUPPORT (pas ADMIN).
- [ ] L'onglet **"Litiges"** doit rester accessible (pas adminOnly)
- [ ] Le support peut donc aussi traiter les litiges

### T-S5.13 — Blacklist active dans le matching
**Setup** : un patron A et un worker B ont eu un litige qui a été résolu en cochant "Ajouter à la blacklist".
- [ ] Patron A crée une nouvelle mission SEARCHING avec skills correspondant à ceux de worker B
- [ ] Worker B ne reçoit **pas** la notification push "Nouvelle mission"
- [ ] Dans la réponse de `/api/missions/notify-candidates`, `excluded: 1` (au moins)
- [ ] Worker B dans son onglet "Rechercher" ne voit **plus** les missions du patron A
- [ ] (Des missions d'autres patrons restent visibles)

---

## Sprint 5.5 — Historique paiements patron (2026-04-20)

### T-S5.5.1 — Onglet Paiements dans la sidebar
- [ ] Un nouvel onglet **"Paiements"** (icône CreditCard bleue) apparaît entre "Mes documents" et "Planning"
- [ ] Clic → `/patron/paiements`

### T-S5.5.2 — Stats globales
- [ ] 4 stat cards en haut : Total dépensé / En attente (bloqués) / Commission payée / Remboursé
- [ ] Les montants sont calculés sur l'ensemble des missions du patron avec `payment_status` non nul

### T-S5.5.3 — Filtres et recherche
- [ ] 6 filtres : Tous / Bloqués / Payés / Libérés / Remboursés / Échoués
- [ ] Barre de recherche (titre mission ou nom prestataire)
- [ ] Cliquer un filtre recharge instantanément la liste

### T-S5.5.4 — Liste
- [ ] Chaque ligne affiche : titre mission, badge statut coloré, nom prestataire, date, commission, montant
- [ ] Cliquer une ligne → ouvre la modale détails

### T-S5.5.5 — Modale détails paiement
- [ ] Affiche : Mission, Prestataire, Statut, Autorisé, Capturé, Commission 15%, Net prestataire (captured - commission)
- [ ] Dates création + capture
- [ ] ID Stripe PaymentIntent avec lien direct vers le dashboard Stripe test

### T-S5.5.6 — État vide
- [ ] Si aucun paiement : affiche le composant EmptyState avec icône CreditCard et message approprié selon le filtre

---

## Sprint 6 — Planning vues semaine/jour + drag-drop + conflits (2026-04-20)

### T-S6.1 — View switcher
- [ ] Dans l'onglet **Planning**, 3 boutons M/S/J en haut à droite (Mois / Semaine / Jour)
- [ ] Cliquer M → vue mois classique (calendrier grille)
- [ ] Cliquer S → vue semaine (colonnes 7 jours + grille heures 7h-23h)
- [ ] Cliquer J → vue jour (une colonne + grille heures)
- [ ] Boutons ← / → naviguent selon la vue active (mois/semaine/jour)

### T-S6.2 — Vue semaine
- [ ] 7 colonnes (Lun→Dim) + colonne heures à gauche (7h à 23h)
- [ ] Les events apparaissent positionnés selon leur `time` et hauteur selon `endTime`
- [ ] Le jour courant est surligné en bleu
- [ ] Missions planifiées (avec `scheduledDate`) apparaissent en indigo

### T-S6.3 — Drag-and-drop replanification
**Setup** : créer un event "Test DnD" à 10h lundi.
- [ ] Cliquer et glisser la carte event vers un autre créneau (ex: mercredi 14h)
- [ ] La zone cible est surlignée en vert pendant le drag
- [ ] Lâcher → l'event est déplacé visuellement
- [ ] Rafraîchir la page → l'event est bien à sa nouvelle date/heure (persistence Supabase via `syncUpdateEvent`)
- [ ] La durée (endTime) est préservée (ex: event 10h-12h devient 14h-16h)

### T-S6.4 — Détection conflits
**Setup** : créer 2 events qui se chevauchent (ex: 10h-11h + 10h30-11h30 le même jour).
- [ ] Les 2 cartes s'affichent avec un **ring rouge** (anneau rouge autour)
- [ ] Icône **AlertTriangle** ⚠ visible à côté du titre
- [ ] Le conflit est détecté entre events, entre missions, ou entre un event et une mission

### T-S6.5 — Double-clic pour créer
- [ ] Double-cliquer sur un créneau vide (ex: mardi 15h) → ouvre la modale de création d'event pré-remplie avec cette date et heure
- [ ] Compléter le titre et sauver → l'event apparaît au bon endroit

### T-S6.6 — Vue jour
- [ ] Passer en J → une seule colonne grande largeur avec grille heures
- [ ] Drag-drop marche pareil (mais dans la même colonne, change uniquement l'heure)
- [ ] Navigation ← / → avance/recule d'**un jour**

### T-S6.7 — Clic event/mission
- [ ] Cliquer un event sans drag → ouvre la modale d'édition de l'event
- [ ] Cliquer une mission (indigo) → ouvre MissionDetailsModal

### T-S6.8 — Filtres cohérents
- [ ] Les filtres de type event (MAINTENANCE/STAFFING/etc.) fonctionnent aussi dans les vues semaine/jour

---

## Sprint 6.5 — QuoteReceiverView wire (devis maintenance UI patron) (2026-04-20)

### T-S6.5.1 — Accès depuis MissionDetailsModal
**Setup** : une mission maintenance en status `QUOTE_SENT` avec un `mission.quote` (peut être injecté via le provider flow).
- [ ] Ouvrir la mission → onglet **Devis** accessible
- [ ] En haut de l'onglet : bouton gradient bleu→violet **"Étudier le devis en détail (analyse IA + signature)"**
- [ ] Clic → ouvre `QuoteReceiverView` en overlay plein écran (z-index 300)

### T-S6.5.2 — Workflow QuoteReceiverView
- [ ] L'overlay affiche le workflow multi-steps : study / questions / terms / sign / pay
- [ ] Analyse IA du devis (scoring, niveau de confiance)
- [ ] Questions possibles sur les items du devis
- [ ] CGV complètes affichables
- [ ] Signature manuscrite + vérification téléphone
- [ ] Choix mode de paiement

### T-S6.5.3 — Accept / Reject / Question
- [ ] **Accept** (signature validée) → appelle `acceptQuote(missionId, signatureData)` → quote.status devient `ACCEPTED`, mission status → `SCHEDULED`, overlay se ferme
- [ ] **Reject** avec raison → appelle `rejectQuote(missionId, rejection)` → quote.status devient `REJECTED`, mission → `CANCELLED`, overlay se ferme
- [ ] **Poser une question** → appelle `askQuoteQuestion(missionId, message)` → la question est persistée dans `mission.quote.questions[]` avec status `pending`
- [ ] Bouton **Fermer** (X) en haut → ferme l'overlay sans modifier la mission

### T-S6.5.4 — État mission après accept
- [ ] La mission apparaît en statut "Acceptée" dans la liste
- [ ] La mission passe dans le planning (côté onglet Planning)
- [ ] Le flux paiement Stripe peut ensuite être déclenché

---

## Sprint 7 — 2FA Supabase MFA (TOTP) (2026-04-20)

### T-S7.1 — Pré-requis Supabase
Dans Supabase Dashboard → Authentication → Providers → MFA :
- [ ] **Activer TOTP** (si pas déjà le cas)
- [ ] Aucune migration SQL supplémentaire requise (MFA utilise les tables Supabase Auth internes)

### T-S7.2 — Activation 2FA depuis Paramètres
**Setup** : se connecter avec n'importe quel compte (patron ou prestataire).
- [ ] Ouvrir Paramètres (roue crantée bottom-right ou sidebar)
- [ ] Nouvelle section **"Sécurité"** visible (au-dessus de "Notifications")
- [ ] Badge shield gris + label "Authentification à deux facteurs (2FA)"
- [ ] Bouton vert **"Activer la 2FA"**
- [ ] Clic → ouvre `MFASetupModal` (z-index 10000)

### T-S7.3 — Scan QR code + saisie manuelle
- [ ] La modale affiche un **QR code SVG**
- [ ] Scanner avec Google Authenticator / 1Password / Authy / Microsoft Authenticator → un nouveau compte "ConnectCHR" apparaît dans l'app
- [ ] Alternative : copier la **clé manuelle** (bouton clipboard)
- [ ] Cliquer "J'ai ajouté le compte" → passe à l'étape vérification

### T-S7.4 — Vérification code 6 chiffres
- [ ] Champ texte accepte uniquement 6 chiffres
- [ ] Entrer le code de l'app → clic "Vérifier"
- [ ] Si OK : écran "✓ 2FA activée" vert, modale se ferme
- [ ] Si code incorrect : message d'erreur rouge sous le champ

### T-S7.5 — État post-activation
- [ ] De retour dans Paramètres, section Sécurité :
  - Badge shield devient **vert** (ShieldCheck)
  - Badge "ACTIVE" vert à droite
  - Texte : "Application authenticator liée"
  - Bouton devient rouge **"Désactiver la 2FA"**

### T-S7.6 — Challenge MFA au login suivant
**Setup** : se déconnecter puis tenter de se reconnecter avec email/password.
- [ ] Après login email/password réussi, un nouvel écran apparaît : **"Code à 2 facteurs"**
- [ ] Champ grand format 6 chiffres
- [ ] Entrer le code depuis l'app authenticator → clic "Valider"
- [ ] Si OK : accès au dashboard comme normal
- [ ] Si code erroné : message "Code 2FA invalide. Veuillez réessayer."
- [ ] Bouton "Retour" permet d'annuler (revient à l'écran login email/password)

### T-S7.7 — Désactivation 2FA
- [ ] Paramètres → bouton "Désactiver la 2FA"
- [ ] Confirmation native (`confirm()`) : "Désactiver la 2FA ? Votre compte sera moins protégé."
- [ ] OK → le facteur est retiré, badge repasse en gris
- [ ] Le login suivant ne demande plus de code

### T-S7.8 — Comptes avec skills multiples
- [ ] Tester avec admin@home-chr.fr, un patron, un prestataire — la 2FA fonctionne identique pour tous

---

## Sprint 7.5 — A11y + Header simplifié (2026-04-20)

### T-S7.5.1 — Skip-to-content link
- [ ] Charger n'importe quelle page (ex: `/patron/tableau-de-bord`)
- [ ] Appuyer sur **Tab** → un lien bleu **"Aller au contenu principal"** apparaît en haut à gauche
- [ ] Presser Enter → le focus saute au `#main-content` (ignore la sidebar et le header)

### T-S7.5.2 — Focus visible global
- [ ] Naviguer au clavier avec **Tab** sur le dashboard patron
- [ ] Tous les boutons/liens/inputs ont un **anneau bleu** (2px) visible au focus
- [ ] Le focus ne disparaît pas (pas de `outline: none` sans remplacement)

### T-S7.5.3 — Avatar patron = vraies initiales
- [ ] L'avatar en haut à droite (cercle gradient bleu→violet) affiche **les initiales réelles** du user (ex: "AB" pour Adam Berki)
- [ ] Si pas de first_name/last_name : fallback sur première lettre de l'email
- [ ] Clic sur l'avatar → ouvre la modale Paramètres (avant : non-cliquable, "LF" hardcodé)

### T-S7.5.4 — CTA Premium masqué si déjà Premium
**Setup** : dans Paramètres → Abonnement → "Passer au Premium" (toggle `isPremium=true`).
- [ ] Le bouton **"Premium"** (doré) dans le header patron **disparaît**
- [ ] Rétrograder → le bouton réapparaît

### T-S7.5.5 — Aria labels header
Inspecter le DOM via DevTools (onglet Accessibility) :
- [ ] Bouton menu mobile : `aria-label="Ouvrir le menu"` + `aria-expanded`
- [ ] Bouton search mobile : `aria-label="Rechercher"`
- [ ] Bouton notifications : `aria-label="Notifications (X non lues)"` + `aria-expanded`
- [ ] Bouton avatar : `aria-label="Paramètres (connecté en tant que ...)"`

### T-S7.5.6 — Reduced motion
**Setup** : dans les préférences système → "Réduire les animations" (macOS Accessibility, Windows Ease of Access).
- [ ] Les animations Framer Motion sont raccourcies à 0.01ms (via `prefers-reduced-motion`)
- [ ] Pas de nausée possible pour les users sensibles

---

## Sprint 8 — AML Visuals Retours Produit (2026-04-20)

> Basé sur le document "HomeCHR Retours Produit.odt" — 9 points de retour.
> **SQL requis** : `supabase-schema-sprint8.sql` à exécuter avant tests.

### T-S8.P1 — SOS Extra : statut auto-entrepreneur
- [ ] Ouvrir SOS Extra → choisir un poste → étape 2
- [ ] Nouveau selector **"Statut du prestataire"** en tête de page
- [ ] Option violette "Extra (CDD d'usage)" — sous-titre "DPAE employeur obligatoire"
- [ ] Option verte "Auto-entrepreneur" — sous-titre "Indépendant · Facture directement · Pas de DPAE"
- [ ] Valider une mission en Auto-entrepreneur → la mission a `employment_type: 'FREELANCE'` et `dpae_status: 'NOT_REQUIRED'`
- [ ] Aucune invite à faire la DPAE n'apparaît pour la mission FREELANCE

### T-S8.P2 — Techniciens : Café/Bière en premier + total récap
- [ ] Ouvrir le sélecteur de service TECHNICIENS dans CreateMissionWizard
- [ ] Le groupe **"Café & Bière"** (Tech Machine à Café + Tech Pompe à Bière) est le **premier** affiché
- [ ] Dans l'onglet Missions patron : une ligne **"Total · N demandes"** en bas de la liste
- [ ] Chaque mission reste une carte distincte

### T-S8.P3 — Bug ajout article stock corrigé
**Setup** : patron Premium, établissement actif.
- [ ] Onglet Stock → bouton "Ajouter un article"
- [ ] Remplir Nom="Coca", Quantité=5, Catégorie=**Boissons**, Seuil=5, Prix=85
- [ ] Cliquer "Ajouter l'article" → loading "Ajout..." puis fermeture
- [ ] L'article Coca apparaît dans la liste
- [ ] Retest les 3 autres catégories → toutes OK
- [ ] Si pas d'établissement actif : message rouge "Sélectionnez un établissement..."

### T-S8.P4 — Facturation électronique (loi septembre 2026)
**Setup** : `supabase-schema-sprint8.sql` appliqué. Une mission COMPLETED avec facture.
- [ ] MissionDetailsModal → onglet Facture → section bleue "Facturation électronique"
- [ ] Bouton "Générer et transmettre (Factur-X)" → "Transmission en cours..." → "Facture transmise" + référence
- [ ] Vérifier Supabase : `invoices.electronic_status='TRANSMITTED'`, `archive_until` = date + 10 ans, ligne dans `invoice_send_history`
- [ ] Sans PDP_API_KEY → mode STUB (référence `STUB-xxxx`)

### T-S8.P5 — Module Bâtiments activé
- [ ] L'accueil n'affiche plus "Bientôt disponible" sur Bâtiments
- [ ] CreateMissionWizard catégorie Bâtiments → 4 groupes visibles (Rénovation / Construction / Travaux CHR / Installations)

### T-S8.P6 — Module Mobilier CHR "À venir"
- [ ] Accueil : nouvelle carte "Mobilier CHR" (icône Armchair) avec badge "À venir"

### T-S8.P7 — Module Personnel reclassé
- [ ] Accueil carte Personnel : titre "Personnel", sous-titre "Renfort intérim · Auto-entrepreneur"

### T-S8.P8 — Badge statut emploi côté employeur
- [ ] Chaque mission dans MissionsTab affiche badge EXTRA CDD (violet) ou AUTO-ENTREPRENEUR (vert)
- [ ] Nom établissement affiché en plus de catégorie + date

### T-S8.P9 — Parcours auto-entrepreneur : infos admin
**Setup** : compte prestataire FREELANCE.
- [ ] "Mon profil" → section verte "Informations administratives"
- [ ] Champs : SIRET (14 chiffres), Forme juridique (select), Code APE, IBAN (validation FR76...), checkbox TVA
- [ ] Note : "Le livret A n'est pas accepté"
- [ ] Sauvegarde → "Informations enregistrées"
- [ ] Colonnes Supabase `profiles.iban / vat_liable / ape_code / legal_form` renseignées

---

## Matrice navigateurs recommandée
| Navigateur | Chat | Push | Realtime |
|---|---|---|---|
| Chrome desktop | ✓ | ✓ | ✓ |
| Edge desktop | ✓ | ✓ | ✓ |
| Firefox desktop | ✓ | ✓ | ✓ |
| Safari desktop 16.4+ | ✓ | ✓ (PWA installée) | ✓ |
| Chrome Android | ✓ | ✓ | ✓ |
| Safari iOS 16.4+ | ✓ | ✓ (PWA home-screen) | ✓ |
| Safari iOS < 16.4 | ✓ | ✗ | ✓ |

## Bugs connus / limitations en cours

- Chat côté **prestataire** pas encore implémenté (pas de bouton pour ouvrir le thread depuis le côté worker — prévu Sprint suivant)
- Matching **par distance** pas actif (uniquement par skills) — colonnes lat/lng à ajouter sur `profiles`
- Pas de **timeout progressif** (élargissement rayon auto si personne ne postule)
- Le bouton **"Appeler"** dans MissionDetailsModal est non-fonctionnel (UI seulement)
- Une notif push ne lie **pas encore** vers le thread exact du chat (ouvre `/patron/missions` générique)

## Format rapport de bug
Pour chaque bug trouvé, indiquer :
- **Navigateur + OS** (ex. Chrome 121 / Windows 11)
- **Compte utilisé** (patron / worker / email si spécifique)
- **Étapes de reproduction** (numérotées)
- **Résultat attendu vs observé**
- **Console navigateur** (F12 > Console, copier les erreurs rouges)
- **Network** (F12 > Network, filtrer sur l'API concernée si erreur HTTP)
- **Screenshot/vidéo** si visuel
