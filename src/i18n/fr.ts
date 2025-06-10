export default {
    // Général
    tasks: 'Tâches',
    calendar: 'Calendrier',
    appointments: 'Rendez-vous',
    aiAssistant: 'Assistant IA',
    settings: 'Paramètres',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    error: 'Erreur',

    // Tâches
    addTask: 'Ajouter une tâche',
    updateTask: 'Mettre à jour la tâche',
    taskDetails: 'Détails de la tâche',
    taskTitle: 'Titre de la tâche',
    taskTitlePlaceholder: 'Ex: Faire les courses',
    description: 'Description',
    descriptionPlaceholder: 'Ex: Lait, pain, oeufs...',
    dueDate: 'Date d\'échéance',
    selectDate: 'Sélectionner une date',
    titleRequired: 'Le titre est requis',
    noTasks: 'Aucune tâche pour le moment. Ajoutez-en une !',

    // Événements
    addEvent: 'Ajouter un événement',
    updateEvent: 'Mettre à jour l\'événement',
    deleteEvent: 'Supprimer l\'événement',
    deleteEventConfirmation: 'Êtes-vous sûr de vouloir supprimer cet événement ?',
    eventDetails: 'Détails de l\'événement',
    eventTitle: 'Titre de l\'événement',
    eventTitlePlaceholder: 'Ex: Réunion d\'équipe',
    locationOptional: 'Lieu (Optionnel)',
    locationPlaceholder: 'Ex: Salle de conférence 4',
    descriptionOptional: 'Description (Optionnel)',
    starts: 'Début',
    ends: 'Fin',
    endDateError: 'La date de fin doit être après la date de début.',
    noEventsForDay: 'Aucun événement pour ce jour.',
    eventReminder: 'Rappel d\'événement',

    // Rendez-vous
    addAppointment: 'Ajouter un RDV',
    updateAppointment: 'Mettre à jour le RDV',
    appointmentDetails: 'Détails du RDV',
    appointmentTitle: 'Titre du RDV',
    appointmentTitlePlaceholder: 'Ex: Contrôle dentiste',
    dateAndTime: 'Date et Heure',
    contactOptional: 'Contact (Optionnel)',
    contactPlaceholder: 'Ex: Dr. Martin',
    notesOptional: 'Notes (Optionnel)',
    notesPlaceholder: 'Ex: Parler du mal de dent',
    noAppointments: 'Aucun rendez-vous pour le moment.',
    appointmentReminder: 'Rappel de rendez-vous',
    contact: 'Contact',

    // Chat IA
    aiWelcome: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?',
    askAiPlaceholder: 'Demandez-moi n\'importe quoi...',
    aiError: 'Désolé, j\'ai rencontré une erreur',
    aiNotConfigured: 'Fournisseur IA non configuré. Allez dans les Paramètres pour le configurer.',
    
    // Paramètres
    appearance: 'Apparence',
    darkMode: 'Mode Sombre',
    language: 'Langue',
    aiSettings: 'Paramètres de l\'Assistant IA',
    aiProvider: 'Fournisseur IA',
    apiKey: 'Clé API',
    enterApiKey: 'Entrez votre clé API ici',
    settingsSaved: 'Paramètres enregistrés',
    aiSettingsUpdated: 'Vos paramètres IA ont été mis à jour.',

    archive: 'Archives',
    today: 'Aujourd\'hui',
    pastTasks: 'Tâches passées',
    all: 'Tout',
    week: 'Semaine',
    noPastTasks: 'Aucune tâche dans les archives.',
    year: 'Année',
    month: 'Mois',

    searchInArchive: 'Rechercher dans les archives...',
    noResultsFound: 'Aucun résultat trouvé.',
    restore: 'Restaurer',
    noUpcomingAppointments: 'Aucun RDV à venir.',
    noPastAppointments: 'Aucun RDV passé.',
    deleteAppointment: 'Supprimer le RDV',
    deleteAppointmentConfirmation: 'Êtes-vous sûr de vouloir supprimer définitivement ce rendez-vous ?',

    // Pour les paramètres de l'IA
    model: 'Modèle',
    hfModelIdLabel: 'ID du Modèle Hugging Face',
    modelRequired: 'La sélection d\'un modèle est requise.',

    // Utilisé comme titre par défaut pour une nouvelle conversation
    newConversation: 'Nouvelle Conversation',

    // Titre de l'écran de chat lorsqu'une conversation est active
    conversation: 'Conversation',

    // Message dans la liste de chat vide
    startTyping: 'Commencez à écrire pour démarrer la conversation...',

    // Message dans la liste de chat vide si un problème survient
    noConversationSelected: 'Aucune conversation sélectionnée. Veuillez revenir à l\'historique pour en sélectionner ou en créer une.',

    // Message dans la liste d'historique vide
    noConversations: 'Aucune conversation pour le moment. Appuyez sur le bouton + pour en commencer une !',

    deleteConversationTitle: 'Supprimer la Conversation',
    deleteConversationMessage: 'Êtes-vous sûr de vouloir supprimer définitivement "{{title}}" ? Cette action est irréversible.',

    taskReminderTitle: 'Rappel de Tâche',
    taskReminderMessage: 'Votre tâche "{{title}}" arrive à échéance.',
    appointmentReminderMessage: 'Vous avez un rendez-vous prochainement : "{{title}}".',
    eventReminderMessage: 'L\'événement "{{title}}" va bientôt commencer.',
};
