const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();
const db = admin.firestore();

const CROSSMINT_PROJECT_ID = '8410e23e-d003-4061-9b65-7c886a6c46ec';
const CROSSMINT_SERVER_KEY = 'sk_production_6627PmBFDZBZzt8ZgeSZ8AiD5e1hUsjyV3K1YQVpkkPEnfwGHhQng8ZhMmpQcv4gnNPSdZTmkAwP7xZBFTdAe5Z9BuwE5pBEq3AAKgaXr5ctKHLzDrj7VNqmW5m7nqVrLajZDnCoFSdSLeseS3KcaFxRh6z5BCdXJJKcwJZbyX3pNrQn7ksFKvcHPVzV7NSp3hmHWsMt4A1ADCDB4Utk1mnr';

const tribes = {
    'Iron Will': { probability: 0.245, background: 'https://i.imgur.com/QPQXtX5.png' },
    'Blood For Conquest': { probability: 0.245, background: 'https://i.imgur.com/zPayyR7.png' },
    'Fabled': { probability: 0.245, background: 'https://i.imgur.com/G0hXKXn.png' },
    'Tribal War': { probability: 0.245, background: 'https://i.imgur.com/X8dIi5T.png' },
    'Ethereal Signature': { probability: 0.02, background: 'https://i.imgur.com/o0d99bB.png' }
};

exports.mintCard = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new Error('Unauthorized');
    const { attack, health, taunt, alliesHealth, walletAddress } = data;

    const tribe = rollTribe(false);
    const cardId = generateUUID();
    const serialNumber = await getNextSerialNumber();

    const card = {
        card_id: cardId,
        season0_id: Math.floor(Math.random() * 100) + 1,
        tribe,
        owner_wallet: walletAddress,
        serial_number: serialNumber,
        attack,
        health,
        mana_cost: attack + health,
        abilities: { haste: false, taunt, allies_boost: alliesHealth },
        rare_traits: rollRareTrait(),
        created_at: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('cards').doc(cardId).set(card);
    await mintNFT(card, walletAddress);
    return card;
});

exports.buyPack = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new Error('Unauthorized');
    const { walletAddress } = data;

    const cards = [];
    for (let i = 0; i < 3; i++) {
        const tribe = rollTribe(true);
        const cardId = generateUUID();
        const serialNumber = await getNextSerialNumber();
        const baseCard = /* Random card from Season0.csv */;

        const card = {
            card_id: cardId,
            season0_id: baseCard.cardId,
            tribe,
            owner_wallet: walletAddress,
            serial_number: serialNumber,
            attack: parseInt(baseCard.attack),
            health: parseInt(baseCard.health),
            mana_cost: parseInt(baseCard.cost),
            abilities: rollAbilities(),
            rare_traits: rollRareTrait(),
            created_at: admin.firestore.FieldValue.serverTimestamp()
        };

        if (tribe === 'Ethereal Signature') {
            const trackerDoc = await db.collection('ethereal_signature_tracker').doc(card.season0_id.toString()).get();
            if (trackerDoc.exists && trackerDoc.data().is_minted) continue;
            await db.collection('ethereal_signature_tracker').doc(card.season0_id.toString()).set({
                is_minted: true,
                owner_wallet: walletAddress
            });
            card.attack += 2;
            card.health += 2;
        }

        await db.collection('cards').doc(cardId).set(card);
        await mintNFT(card, walletAddress);
        cards.push(card);
    }
    return cards;
});

function rollTribe(isPack) {
    const rand = Math.random();
    if (isPack && rand < 0.02) return 'Ethereal Signature';
    const nonEthereal = Object.keys(tribes).filter(t => t !== 'Ethereal Signature');
    return nonEthereal[Math.floor(Math.random() * nonEthereal.length)];
}

function rollAbilities() {
    const abilities = ['haste', 'taunt', 'double_strike', 'stealth', 'gold_shield'];
    const result = {};
    abilities.forEach(a => result[a] = Math.random() < 0.05);
    return result;
}

function rollRareTrait() {
    const rand = Math.random();
    if (rand < 0.03) return { life: true };
    if (rand < 0.05) return { fire: true };
    if (rand < 0.07) return { foil: true };
    return {};
}

async function getNextSerialNumber() {
    const counterDoc = await db.collection('counters').doc('cards').get();
    const current = counterDoc.exists ? counterDoc.data().count : 0;
    if (current >= 100000) throw new Error('Minting limit reached');
    await db.collection('counters').doc('cards').set({ count: current + 1 }, { merge: true });
    return current + 1;
}

async function mintNFT(card, walletAddress) {
    await axios.post('https://staging.crossmint.com/api/2022-06-09/nfts', {
        recipient: `polygon:${walletAddress}`,
        metadata: {
            name: `${card.tribe} Card #${card.serial_number}`,
            image: card.tribe.background,
            attributes: [
                { trait_type: 'Tribe', value: card.tribe },
                { trait_type: 'Attack', value: card.attack },
                { trait_type: 'Health', value: card.health }
            ]
        }
    }, {
        headers: {
            'X-PROJECT-ID': CROSSMINT_PROJECT_ID,
            'X-API-KEY': CROSSMINT_SERVER_KEY,
            'Content-Type': 'application/json'
        }
    });
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
