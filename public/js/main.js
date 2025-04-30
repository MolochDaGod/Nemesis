document.addEventListener('DOMContentLoaded', function() {
    // Firebase initialization
    const firebaseConfig = {
        apiKey: "YOUR_API_KEY",
        authDomain: "Model-wave-458100-h7-9bf03.firebaseapp.com",
        projectId: "Model-wave-458100-h7-9bf03",
        storageBucket: "Model-wave-458100-h7-9bf03.appspot.com",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
    };
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Crossmint Configuration
    const CROSSMINT_PROJECT_ID = "8410e23e-d003-4061-9b65-7c886a6c46ec";
    const CROSSMINT_SERVER_KEY = "sk_production_6627PmBFDZBZzt8ZgeSZ8AiD5e1hUsjyV3K1YQVpkkPEnfwGHhQng8ZhMmpQcv4gnNPSdZTmkAwP7xZBFTdAe5Z9BuwE5pBEq3AAKgaXr5ctKHLzDrj7VNqmW5m7nqVrLajZDnCoFSdSLeseS3KcaFxRh6z5BCdXJJKcwJZbyX3pNrQn7ksFKvcHPVzV7NSp3hmHWsMt4A1ADCDB4Utk1mnr";
    const CROSSMINT_COLLECTION_ID = "YOUR_NEW_COLLECTION_ID"; // Replace with Crossmint-provided collectionID
    const WEBHOOK_URL = "https://discord.com/api/webhooks/1343000704968556628/Zcbixg1sbvTZ2ptuKa5LkDyqOEhYkCTKebvaMlGKBIcZmqIgQJz6j92u1yRR6ImAYfra";
    const DISCORD_CLIENT_ID = "1342593452793270302";
    const DISCORD_REDIRECT_URI = "https://www.grudgeplatform.com/minter.html";

    // Game state
    let userBalance = parseInt(localStorage.getItem('gbuxBalance')) || 1000;
    let packCount = parseInt(localStorage.getItem('packCount')) || 0;
    let ownedCards = JSON.parse(localStorage.getItem('ownedCards')) || [];
    let walletAddress = sessionStorage.getItem('walletAddress') || '0x' + Math.random().toString(16).slice(2, 42);
    sessionStorage.setItem('walletAddress', walletAddress);
    let isOnline = navigator.onLine;
    let mintedCards = parseInt(localStorage.getItem('mintedCards')) || 0;
    let showOwnedOnly = false;
    let selectedCards = [];
    let currentDeckSlot = '1';
    const maxMints = 100000;

    // Season 0 cards (continued from cardId: 67)
    const season0 = [
        { id: 1, name: "Grudge", type: "minion", attack: 2, health: 2, mana_cost: 3, description: "A basic fighter.", backgroundImage: "/assets/grudge.png", startingAmount: 2 },
        { id: 2, name: "Stealth Drone", type: "minion", attack: 1, health: 1, mana_cost: 1, description: "Quick scouting unit cloaked in shadow.", backgroundImage: "/assets/stealth_drone.png", startingAmount: 2 },
        { id: 3, name: "A Coward Priest", type: "minion", attack: 1, health: 1, mana_cost: 1, description: "Basic reconnaissance unit.", backgroundImage: "/assets/cowardly_priest.png", startingAmount: 2 },
        { id: 4, name: "Starborn Light", type: "minion", attack: 1, health: 1, mana_cost: 1, description: "Summons structures.", backgroundImage: "/assets/starborn_esper.png", startingAmount: 2 },
        { id: 5, name: "Arcane Mystic", type: "minion", attack: 2, health: 3, mana_cost: 2, description: "Casts arcane spells with finesse.", backgroundImage: "/assets/arcane_archer.png", startingAmount: 2 },
        { id: 6, name: "Alpha Skiff", type: "minion", attack: 1, health: 2, mana_cost: 2, description: "On play: Deal 2 damage to an enemy.", backgroundImage: "/assets/alpha_skiff.png", startingAmount: 2 },
        { id: 7, name: "Orcish Sniper",