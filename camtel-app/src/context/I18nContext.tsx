import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';

export type Language = 'en' | 'fr';

type Dictionary = Record<string, string>;

// data table setup
// key format note
const TRANSLATIONS: Record<string, { en: string; fr: string }> = {
  // section
  'brand.name': { en: 'CAMTEL', fr: 'CAMTEL' },
  'common.login': { en: 'Login', fr: 'Connexion' },
  'common.loggingIn': { en: 'Logging in…', fr: 'Connexion…' },
  'common.logout': { en: 'Logout', fr: 'Déconnexion' },
  'common.register': { en: 'Register', fr: 'S’inscrire' },
  'common.password': { en: 'Password', fr: 'Mot de passe' },
  'common.confirmPassword': { en: 'Confirm password', fr: 'Confirmer le mot de passe' },
  'common.showPassword': { en: 'Show password', fr: 'Afficher le mot de passe' },
  'common.hidePassword': { en: 'Hide password', fr: 'Masquer le mot de passe' },
  'common.email': { en: 'Email address', fr: 'Adresse e-mail' },
  'common.emailShort': { en: 'Email', fr: 'E-mail' },
  'common.emailOrPhone': { en: 'Email or phone', fr: 'E-mail ou téléphone' },
  'common.phoneOrEmail': { en: 'Phone number or email', fr: 'Numéro de téléphone ou e-mail' },
  'common.fullName': { en: 'Full name', fr: 'Nom complet' },
  'common.forgotPassword': { en: 'Forgot password?', fr: 'Mot de passe oublié ?' },
  'common.dontHaveAccount': { en: "Don't have an account?", fr: 'Vous n’avez pas de compte ?' },
  'common.alreadyHaveAccount': { en: 'Already have an account?', fr: 'Vous avez déjà un compte ?' },
  'common.status': { en: 'Status', fr: 'Statut' },
  'common.description': { en: 'Description', fr: 'Description' },
  'common.region': { en: 'Region', fr: 'Région' },
  'common.city': { en: 'City', fr: 'Ville' },
  'common.sender': { en: 'Sender', fr: 'Expéditeur' },
  'common.contact': { en: 'Contact', fr: 'Contact' },
  'common.action': { en: 'Action', fr: 'Action' },
  'common.actions': { en: 'Actions', fr: 'Actions' },
  'common.complaintType': { en: 'Complaint Type', fr: 'Type de plainte' },
  'common.dateSubmitted': { en: 'Date Submitted', fr: 'Date de soumission' },
  'common.service': { en: 'Service', fr: 'Service' },
  'common.ticketNumber': { en: 'Ticket Number', fr: 'Numéro de ticket' },
  'common.name': { en: 'Name', fr: 'Nom' },
  'common.role': { en: 'Role', fr: 'Rôle' },
  'common.submit': { en: 'Submit', fr: 'Envoyer' },
  'common.cancel': { en: 'Cancel', fr: 'Annuler' },
  'common.save': { en: 'Save', fr: 'Enregistrer' },
  'common.close': { en: 'Close', fr: 'Fermer' },
  'common.language': { en: 'Language', fr: 'Langue' },
  'common.theme.day': { en: 'Day', fr: 'Jour' },
  'common.theme.night': { en: 'Night', fr: 'Nuit' },
  'role.agent': { en: 'Agent', fr: 'Agent' },
  'role.manager': { en: 'Manager', fr: 'Responsable' },
  'common.subscriber': { en: 'Subscriber', fr: 'Abonné(e)' },
  'common.regionCity': { en: 'Region / City', fr: 'Région / Ville' },
  'common.regionCitySlash': { en: 'Region/City', fr: 'Région/Ville' },
  'common.assignedAgent': { en: 'Assigned Agent', fr: 'Agent assigné' },
  'common.phone': { en: 'Phone', fr: 'Téléphone' },
  'common.created': { en: 'Created', fr: 'Créé le' },
  'common.location': { en: 'Location', fr: 'Emplacement' },
  'common.department': { en: 'Department', fr: 'Département' },
  'common.assignedRegion': { en: 'Assigned region', fr: 'Région assignée' },
  'common.assignedService': { en: 'Assigned service', fr: 'Service assigné' },
  'common.serviceType': { en: 'Service type', fr: 'Type de service' },
  'common.complaintTypeLower': { en: 'Complaint type', fr: 'Type de plainte' },

  // section
  'roleSelect.title': { en: 'Welcome to CAMTEL', fr: 'Bienvenue chez CAMTEL' },
  'roleSelect.subtitle': {
    en: 'Tell us who you are so we can take you to the right place.',
    fr: 'Dites-nous qui vous êtes pour vous diriger au bon endroit.',
  },
  'roleSelect.customerTitle': { en: "I'm a Customer", fr: 'Je suis client(e)' },
  'roleSelect.customerDesc': {
    en: 'Track and submit complaints about your CAMTEL service.',
    fr: 'Suivez et déposez des plaintes concernant votre service CAMTEL.',
  },
  'roleSelect.customerCta': { en: 'Continue as customer', fr: 'Continuer en tant que client(e)' },
  'roleSelect.staffTitle': { en: 'I work at CAMTEL', fr: 'Je travaille chez CAMTEL' },
  'roleSelect.staffDesc': {
    en: 'Agent and manager access to the internal complaints platform.',
    fr: 'Accès agent et responsable à la plateforme interne des plaintes.',
  },
  'roleSelect.staffCta': { en: 'Continue as staff', fr: 'Continuer en tant que personnel' },

  // section
  'login.title': { en: 'Subscriber Login', fr: 'Connexion abonné(e)' },
  'login.demoHint': { en: 'Demo: 0600000000 / password', fr: 'Démo : 0600000000 / password' },
  'login.staffLink': { en: 'CAMTEL staff? Go to internal login', fr: 'Personnel CAMTEL ? Accéder à la connexion interne' },
  'login.backToRoleSelect': { en: '← Not you? Choose a different path', fr: '← Ce n’est pas vous ? Choisir un autre accès' },
  'login.verifyEmailLink': { en: 'Have a verification code?', fr: 'Vous avez un code de vérification ?' },

  // section
  'verify.title': { en: 'Verify your email', fr: 'Vérifiez votre e-mail' },
  'verify.subtitle': {
    en: 'Enter the 6-digit code we emailed you to finish creating your account.',
    fr: 'Saisissez le code à 6 chiffres reçu par e-mail pour finaliser la création de votre compte.',
  },
  'verify.codeLabel': { en: 'Verification code', fr: 'Code de vérification' },
  'verify.submit': { en: 'Verify', fr: 'Vérifier' },
  'verify.verifying': { en: 'Verifying…', fr: 'Vérification…' },
  'verify.resend': { en: 'Resend code', fr: 'Renvoyer le code' },
  'verify.resending': { en: 'Resending…', fr: 'Envoi…' },
  'verify.resendSuccess': { en: 'A new code has been sent', fr: 'Un nouveau code a été envoyé' },
  'verify.success': { en: 'Email verified — welcome to CAMTEL!', fr: 'E-mail vérifié — bienvenue chez CAMTEL !' },

  // section
  'internal.title': { en: 'CAMTEL Internal Platform', fr: 'Plateforme interne CAMTEL' },
  'internal.subtitle': { en: 'Staff access only', fr: 'Accès réservé au personnel' },
  'internal.demoHint': {
    en: 'Demo agent: agent@camtel.cm / agent',
    fr: 'Démo agent : agent@camtel.cm / agent',
  },
  'internal.demoHintManager': {
    en: 'Demo manager: manager@camtel.cm / manager',
    fr: 'Démo responsable : manager@camtel.cm / manager',
  },
  'internal.customerLink': { en: 'Customer? Go to subscriber login', fr: 'Client(e) ? Accéder à la connexion abonné(e)' },
  'internal.backToRoleSelect': { en: '← Not staff? Choose a different path', fr: '← Pas du personnel ? Choisir un autre accès' },

  // section
  'register.title': { en: 'Create your CAMTEL account', fr: 'Créer votre compte CAMTEL' },
  'register.camtelPhone': { en: 'CAMTEL phone number', fr: 'Numéro de téléphone CAMTEL' },
  'register.camtelAccount': { en: 'CAMTEL account number', fr: 'Numéro de compte CAMTEL' },
  'register.serviceType': { en: 'Service type', fr: 'Type de service' },
  'register.subtitle': {
    en: 'Submit and track your complaints in real time',
    fr: 'Déposez et suivez vos plaintes en temps réel',
  },
  'register.createAccount': { en: 'Create Account', fr: 'Créer un compte' },
  'register.creating': { en: 'Creating…', fr: 'Création…' },
  'register.selectEllipsis': { en: 'Select…', fr: 'Sélectionner…' },
  'register.noAccountHint': {
    en: "Don't have a CAMTEL account number yet? Enter 0000000000.",
    fr: 'Vous n’avez pas encore de numéro de compte CAMTEL ? Saisissez 0000000000.',
  },
  'register.checkEmail': {
    en: 'Almost there — check your email for a verification code',
    fr: 'Presque terminé — consultez votre e-mail pour le code de vérification',
  },
  'register.contactMethod': {
    en: 'How would you like us to contact you?',
    fr: 'Comment souhaitez-vous être contacté(e) ?',
  },
  'register.contactEmailOnly': { en: 'Email only', fr: 'E-mail uniquement' },
  'register.contactPhoneOnly': { en: 'Phone only', fr: 'Téléphone uniquement' },
  'register.contactBoth': { en: 'Both email and phone', fr: 'E-mail et téléphone' },

  // section
  'nav.myComplaints': { en: 'My Complaints', fr: 'Mes plaintes' },
  'nav.submitComplaint': { en: 'Submit Complaint', fr: 'Déposer une plainte' },
  'sidebar.dashboard': { en: 'Dashboard', fr: 'Tableau de bord' },
  'sidebar.heatmap': { en: 'Heat Map', fr: 'Carte thermique' },
  'sidebar.kpis': { en: 'KPIs & Analytics', fr: 'Indicateurs & analyses' },
  'sidebar.reports': { en: 'Reports', fr: 'Rapports' },
  'sidebar.users': { en: 'User Management', fr: 'Gestion des utilisateurs' },
  'sidebar.config': { en: 'Configuration', fr: 'Configuration' },

  // section
  'page.myComplaints': { en: 'My Complaints', fr: 'Mes plaintes' },
  'page.submitComplaint': { en: 'Submit a Complaint', fr: 'Déposer une plainte' },
  'page.agentComplaints': { en: 'Assigned Complaints', fr: 'Plaintes assignées' },
  'page.managerDashboard': { en: 'Dashboard Overview', fr: 'Aperçu du tableau de bord' },
  'page.managerHeatmap': { en: 'Geographic Heat Map', fr: 'Carte thermique géographique' },
  'page.managerKpis': { en: 'KPIs & Analytics', fr: 'Indicateurs & analyses' },
  'page.managerReports': { en: 'Report History', fr: 'Historique des rapports' },
  'page.managerUsers': { en: 'User Management', fr: 'Gestion des utilisateurs' },
  'page.managerConfig': { en: 'System Configuration', fr: 'Configuration du système' },

  // section
  'detail.affectedService': { en: 'Affected Service', fr: 'Service concerné' },
  'detail.submissionDate': { en: 'Submission date', fr: 'Date de soumission' },
  'detail.noDescription': { en: 'No description provided', fr: 'Aucune description fournie' },
  'detail.notFound': { en: 'Complaint not found.', fr: 'Plainte introuvable.' },
  'detail.backToMyComplaints': { en: '← My Complaints', fr: '← Mes plaintes' },
  'detail.lastUpdated': { en: 'Last updated:', fr: 'Dernière mise à jour :' },
  'detail.assignedAgentLabel': { en: 'Assigned agent:', fr: 'Agent assigné :' },
  'detail.resolutionNote': { en: 'Resolution note', fr: 'Note de résolution' },
  'detail.rateResolution': { en: 'Rate the Resolution', fr: 'Évaluer la résolution' },
  'detail.tellUsMore': { en: 'Tell us more (optional)', fr: 'Dites-nous en plus (facultatif)' },
  'detail.submitRating': { en: 'Submit Rating', fr: 'Envoyer la note' },
  'detail.yourFeedback': { en: 'Your Feedback', fr: 'Votre avis' },
  'detail.thankYou': { en: 'Thank you for your feedback', fr: 'Merci pour votre avis' },
  'detail.ticketPrefix': { en: 'Ticket', fr: 'Ticket' },
  'reports.generateReport': { en: 'Generate Report', fr: 'Générer un rapport' },
  'reports.generating': { en: 'Generating…', fr: 'Génération…' },
  'reports.reportHistory': { en: 'Report History', fr: 'Historique des rapports' },
  'reports.reportType': { en: 'Report type', fr: 'Type de rapport' },
  'reports.reportTypeCol': { en: 'Report Type', fr: 'Type de rapport' },
  'reports.period': { en: 'Period', fr: 'Période' },
  'reports.startDate': { en: 'Start date', fr: 'Date de début' },
  'reports.endDate': { en: 'End date', fr: 'Date de fin' },
  'reports.generatedAt': { en: 'Generated At', fr: 'Généré le' },
  'reports.generatedBy': { en: 'Generated By', fr: 'Généré par' },

  // section
  // status labels
  'status.SUBMITTED': { en: 'Submitted', fr: 'Soumise' },
  'status.ASSIGNED': { en: 'Assigned', fr: 'Assignée' },
  'status.IN_PROGRESS': { en: 'In Progress', fr: 'En cours' },
  'status.RESOLVED': { en: 'Resolved', fr: 'Résolue' },

  // section
  'common.fillAllFields': { en: 'Please fill in all fields', fr: 'Veuillez remplir tous les champs' },
  'common.somethingWentWrong': { en: 'Something went wrong. Please try again.', fr: 'Une erreur est survenue. Veuillez réessayer.' },
  'common.loading': { en: 'Loading…', fr: 'Chargement…' },
  'common.required': { en: 'required', fr: 'requis' },
  'common.saving': { en: 'Saving…', fr: 'Enregistrement…' },
  'common.updateSaved': { en: 'Update saved successfully', fr: 'Mise à jour enregistrée' },
  'common.apply': { en: 'Apply', fr: 'Appliquer' },
  'common.yes': { en: 'Yes', fr: 'Oui' },

  // section
  // wording note
  'common.invalidCredentials': { en: 'Invalid credentials', fr: 'Identifiants invalides' },

  // section
  'register.success': { en: 'Account created — please log in', fr: 'Compte créé — veuillez vous connecter' },

  // section
  'validation.required': { en: 'Required', fr: 'Requis' },
  'validation.invalidPhone': { en: 'Enter a valid phone number', fr: 'Entrez un numéro de téléphone valide' },
  'validation.invalidEmail': { en: 'Invalid email', fr: 'E-mail invalide' },
  'validation.minPassword': { en: 'Min 6 characters', fr: '6 caractères minimum' },
  'validation.passwordMismatch': { en: 'Passwords do not match', fr: 'Les mots de passe ne correspondent pas' },

  // section
  'submit.success': {
    en: "Complaint submitted successfully. You'll receive a confirmation by email or phone.",
    fr: 'Plainte soumise avec succès. Vous recevrez une confirmation par e-mail ou par téléphone.',
  },
  'submit.confirmedPrefix': { en: 'Complaint submitted. Your ticket number is', fr: 'Plainte soumise. Votre numéro de ticket est' },
  'submit.complaintType': { en: 'Complaint type', fr: 'Type de plainte' },
  'submit.affectedService': { en: 'Affected service', fr: 'Service concerné' },
  'submit.pickRegionFirst': { en: 'Pick a region first', fr: "Choisissez d'abord une région" },
  'submit.locality': { en: 'Locality / quarter', fr: 'Localité / quartier' },
  'submit.otherNotListed': { en: 'Other / not listed', fr: 'Autre / non listé(e)' },
  'submit.descriptionPlaceholder': {
    en: 'Enter your locality to give us more details (e.g. street, landmark, quarter block)',
    fr: 'Indiquez votre localité pour nous donner plus de détails (rue, repère, quartier précis)',
  },
  'submit.descriptionPlaceholderCityOther': {
    en: "Your city isn't in our list — please tell us your exact city and locality here",
    fr: "Votre ville n'est pas dans notre liste — indiquez ici votre ville et votre localité exactes",
  },
  'submit.descriptionPlaceholderLocalityOther': {
    en: "Your locality isn't in our list — please tell us your exact locality/quarter here",
    fr: "Votre localité n'est pas dans notre liste — indiquez ici votre localité/quartier exact",
  },
  'submit.descriptionRequiredOther': {
    en: 'Required — please name your exact city/locality since it was not in the list',
    fr: "Obligatoire — précisez votre ville/localité exacte puisqu'elle n'était pas dans la liste",
  },
  'submit.optional': { en: '(optional)', fr: '(facultatif)' },
  'submit.required': { en: '(required)', fr: '(obligatoire)' },
  'submit.submitting': { en: 'Submitting…', fr: 'Envoi…' },
  'submit.submitComplaint': { en: 'Submit Complaint', fr: 'Déposer une plainte' },

  // section
  'myComplaints.empty': { en: "You haven't submitted any complaints yet.", fr: "Vous n’avez soumis aucune plainte." },
  'myComplaints.viewDetails': { en: 'View Details', fr: 'Voir les détails' },

  // section
  'agent.claimSuccess': { en: 'Complaint claimed', fr: 'Plainte prise en charge' },
  'agent.resolutionNoteRequired': { en: 'Resolution note is required when resolving', fr: 'Une note de résolution est requise' },
  'agent.claimByTicket': { en: 'Claim a complaint by ticket number', fr: 'Prendre en charge une plainte par numéro de ticket' },
  'agent.claiming': { en: 'Claiming…', fr: 'Prise en charge…' },
  'agent.claim': { en: 'Claim', fr: 'Prendre en charge' },
  'agent.emptyState': { en: 'No complaints assigned to you yet', fr: 'Aucune plainte ne vous est assignée' },
  'agent.open': { en: 'Open', fr: 'Ouvrir' },
  'agent.resolutionNote': { en: 'Resolution note', fr: 'Note de résolution' },
  'agent.saveUpdate': { en: 'Save Update', fr: 'Enregistrer' },

  // section
  'dashboard.recurringPrefix': { en: 'Recurring pattern detected:', fr: 'Motif récurrent détecté :' },
  'dashboard.complaintsIn': { en: 'complaints in the', fr: 'plaintes sur la' },
  'dashboard.totalComplaints': { en: 'Total complaints', fr: 'Total des plaintes' },
  'dashboard.resolved': { en: 'Resolved', fr: 'Résolues' },
  'dashboard.avgResolutionTime': { en: 'Avg. resolution time', fr: 'Temps de résolution moyen' },
  'dashboard.lookupTitle': { en: 'Look up & update a ticket', fr: 'Rechercher et mettre à jour un ticket' },
  'dashboard.lookupLabel': { en: 'Ticket number', fr: 'Numéro de ticket' },
  'dashboard.lookup': { en: 'Look up', fr: 'Rechercher' },
  'dashboard.allComplaints': { en: 'All Complaints', fr: 'Toutes les plaintes' },
  'dashboard.filterType': { en: 'Complaint type', fr: 'Type de plainte' },
  'dashboard.filterService': { en: 'Service line', fr: 'Ligne de service' },
  'dashboard.filterRegion': { en: 'Region', fr: 'Région' },
  'dashboard.filterStatus': { en: 'Status', fr: 'Statut' },
  'dashboard.applyFilters': { en: 'Apply Filters', fr: 'Appliquer les filtres' },
  'dashboard.reset': { en: 'Reset', fr: 'Réinitialiser' },
  'dashboard.allTypes': { en: 'All types', fr: 'Tous les types' },
  'dashboard.allServices': { en: 'All services', fr: 'Tous les services' },
  'dashboard.allRegions': { en: 'All regions', fr: 'Toutes les régions' },
  'dashboard.allStatuses': { en: 'All statuses', fr: 'Tous les statuts' },
  'dashboard.unassigned': { en: 'Unassigned', fr: 'Non assigné' },
  'dashboard.noComplaints': { en: 'No complaints match these filters', fr: 'Aucune plainte ne correspond à ces filtres' },
  'dashboard.previous': { en: 'Previous', fr: 'Précédent' },
  'dashboard.next': { en: 'Next', fr: 'Suivant' },
  'dashboard.pageLabel': { en: 'Page', fr: 'Page' },
  'dashboard.ofLabel': { en: 'of', fr: 'sur' },
  'dashboard.view': { en: 'View', fr: 'Voir' },

  // section
  'heatmap.empty': { en: 'No data for the selected period', fr: 'Aucune donnée pour la période sélectionnée' },
  'heatmap.complaints': { en: 'complaints', fr: 'plaintes' },
  'heatmap.byCity': { en: 'By city', fr: 'Par ville' },
  'heatmap.sortBy': { en: 'Sort by', fr: 'Trier par' },
  'heatmap.sortByCount': { en: 'Most complaints', fr: 'Le plus de plaintes' },
  'heatmap.mapAriaLabel': {
    en: 'Map of Cameroon shaded by complaint count per region',
    fr: 'Carte du Cameroun colorée selon le nombre de plaintes par région',
  },

  // section
  'kpis.groupByPrefix': { en: 'Group by:', fr: 'Grouper par :' },
  'kpis.group': { en: 'Group', fr: 'Groupe' },
  'kpis.total': { en: 'Total', fr: 'Total' },
  'kpis.resolved': { en: 'Resolved', fr: 'Résolues' },
  'kpis.avgResolutionHours': { en: 'Avg. resolution (hours)', fr: 'Résolution moy. (heures)' },
  'kpis.recurringPatterns': { en: 'Detected Recurring Patterns', fr: 'Motifs récurrents détectés' },
  'kpis.noPatterns': { en: 'No recurring patterns detected', fr: 'Aucun motif récurrent détecté' },
  'kpis.volume': { en: 'Volume', fr: 'Volume' },
  'kpis.timeWindow': { en: 'Time Window', fr: 'Fenêtre temporelle' },

  // section
  'reports.pickDates': { en: 'Please select a start and end date.', fr: 'Veuillez sélectionner une date de début et de fin.' },
  'reports.generated': { en: 'Report generation started', fr: 'Génération du rapport démarrée' },
  'reports.weekly': { en: 'Weekly', fr: 'Hebdomadaire' },
  'reports.monthly': { en: 'Monthly', fr: 'Mensuel' },
  'reports.noneYet': { en: 'No reports generated in this session yet', fr: 'Aucun rapport généré dans cette session' },
  'reports.downloadPdf': { en: 'Download PDF', fr: 'Télécharger le PDF' },

  // section
  'users.created': { en: 'User created successfully', fr: 'Utilisateur créé avec succès' },
  'users.updated': { en: 'User updated successfully', fr: 'Utilisateur mis à jour' },
  'users.deactivated': { en: 'User deactivated', fr: 'Utilisateur désactivé' },
  'users.reactivated': { en: 'User reactivated', fr: 'Utilisateur réactivé' },
  'users.createNew': { en: 'Create New User', fr: 'Créer un utilisateur' },
  'users.allRoles': { en: 'All roles', fr: 'Tous les rôles' },
  'users.subscriber': { en: 'Subscriber', fr: 'Abonné(e)' },
  'users.active': { en: 'Active', fr: 'Actif' },
  'users.inactive': { en: 'Inactive', fr: 'Inactif' },
  'users.edit': { en: 'Edit', fr: 'Modifier' },
  'users.deactivate': { en: 'Deactivate', fr: 'Désactiver' },
  'users.reactivate': { en: 'Reactivate', fr: 'Réactiver' },
  'users.editTitle': { en: 'Edit User', fr: 'Modifier l’utilisateur' },
  'users.emailNotEditable': { en: 'Email cannot be changed', fr: 'L’e-mail ne peut pas être modifié' },
  'users.leaveUnchanged': { en: '— Leave unchanged —', fr: '— Laisser inchangé —' },
  'users.confirmDeactivateTitle': { en: 'Confirm deactivation', fr: 'Confirmer la désactivation' },
  'users.confirmDeactivateBody': {
    en: 'Are you sure you want to deactivate the account for',
    fr: 'Voulez-vous vraiment désactiver le compte de',
  },
  'users.importAgents': { en: 'Import Agents', fr: 'Importer des agents' },
  'users.importTitle': { en: 'Import agents from annuaire', fr: 'Importer des agents depuis l’annuaire' },
  'users.importIntro': {
    en: 'Upload an .xlsx file with columns Name, Surname, Email, Service, Region, Password (Phone optional). Email must already be in surname.name@camtel.com format — it is used exactly as written. Each row becomes an active AGENT account.',
    fr: 'Importez un fichier .xlsx avec les colonnes Name, Surname, Email, Service, Region, Password (Phone facultatif). L’e-mail doit déjà être au format surname.name@camtel.com — il est utilisé tel quel. Chaque ligne devient un compte AGENT actif.',
  },
  'users.importTemplate': { en: 'Download example annuaire', fr: 'Télécharger un exemple d’annuaire' },
  'users.importChooseFile': { en: 'Choose .xlsx file', fr: 'Choisir un fichier .xlsx' },
  'users.importUpload': { en: 'Upload and import', fr: 'Importer' },
  'users.importUploading': { en: 'Importing…', fr: 'Importation…' },
  'users.importSummary': { en: 'imported, ', fr: 'importés, ' },
  'users.importFailedSuffix': { en: 'failed, of ', fr: 'échoués, sur ' },
  'users.importRowsSuffix': { en: 'rows', fr: 'lignes' },
  'users.importColRow': { en: 'Row', fr: 'Ligne' },
  'users.importColName': { en: 'Name', fr: 'Nom' },
  'users.importColEmail': { en: 'Email', fr: 'E-mail' },
  'users.importColStatus': { en: 'Status', fr: 'Statut' },
  'users.importColMessage': { en: 'Message', fr: 'Message' },
  'users.importStatusOk': { en: 'Imported', fr: 'Importé' },
  'users.importStatusFailed': { en: 'Failed', fr: 'Échoué' },
  'users.importDone': { en: 'Import finished', fr: 'Importation terminée' },

  // section
  'config.categoryAdded': { en: 'Category added', fr: 'Catégorie ajoutée' },
  'config.categoryUpdated': { en: 'Category updated', fr: 'Catégorie mise à jour' },
  'config.categoryDeleted': { en: 'Category deleted', fr: 'Catégorie supprimée' },
  'config.addCategory': { en: 'Add Category', fr: 'Ajouter une catégorie' },
  'config.editCategory': { en: 'Edit Category', fr: 'Modifier la catégorie' },
  'config.delete': { en: 'Delete', fr: 'Supprimer' },
  'config.deleteCategoryTitle': { en: 'Delete category', fr: 'Supprimer la catégorie' },
  'config.deleteCategoryBody': {
    en: 'Delete this category? Complaints linked to it will be unaffected.',
    fr: 'Supprimer cette catégorie ? Les plaintes qui y sont liées ne seront pas affectées.',
  },

  // section
  'pwa.offlineReady': { en: 'CAMTEL is ready to work offline', fr: 'CAMTEL est prêt à fonctionner hors ligne' },
  'pwa.updateAvailable': { en: 'A new version is available', fr: 'Une nouvelle version est disponible' },
  'pwa.reload': { en: 'Reload', fr: 'Recharger' },
  'pwa.dismiss': { en: 'Later', fr: 'Plus tard' },
  'pwa.installTitle': { en: 'Install the CAMTEL app', fr: 'Installer l’application CAMTEL' },
  'pwa.installBody': {
    en: 'Install CAMTEL on this device for quick access and a full-screen, app-like experience — no browser bar, launches right from your home screen.',
    fr: 'Installez CAMTEL sur cet appareil pour un accès rapide et une expérience plein écran, comme une application — sans barre de navigateur, lancement direct depuis votre écran d’accueil.',
  },
  'pwa.installIosBody': {
    en: 'To install: tap the Share icon in Safari, then "Add to Home Screen".',
    fr: 'Pour installer : appuyez sur l’icône Partager dans Safari, puis « Sur l’écran d’accueil ».',
  },
  'pwa.install': { en: 'Install', fr: 'Installer' },
  'pwa.installCta': { en: 'Install app', fr: 'Installer l’appli' },

  // section
  'notif.bellLabel': { en: 'Notifications', fr: 'Notifications' },
  'notif.title': { en: 'Notifications', fr: 'Notifications' },
  'notif.markAllRead': { en: 'Mark all read', fr: 'Tout marquer comme lu' },
  'notif.empty': { en: "You're all caught up", fr: 'Vous êtes à jour' },
};

interface I18nContextType {
  lang: Language;
  toggleLang: () => void;
  setLang: (l: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);
const STORAGE_KEY = 'camtel_lang';

function loadStored(): Language {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'en' || raw === 'fr') return raw;
  } catch {
    /* ignore */
  }
  return 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(loadStored);

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const setLang = useCallback((l: Language) => setLangState(l), []);
  const toggleLang = useCallback(() => {
    setLangState((prev) => (prev === 'en' ? 'fr' : 'en'));
  }, []);

  const t = useCallback(
    (key: string) => {
      const entry = TRANSLATIONS[key];
      if (!entry) return key;
      return entry[lang];
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, toggleLang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export type { Dictionary };
