const functions = require('firebase-functions');
const { initializeApp, getFirestore } = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

const firebaseConfig = {
  apiKey: "AIzaSyD7mR6uRQ8RNqOf9nCjATLiXL3orJ39soo",
  authDomain: "model-wave-458100-h7-9bf03.firebaseapp.com",
  databaseURL: "https://model-wave-458100-h7-9bf03-default-rtdb.firebaseio.com",
  projectId: "model-wave-458100-h7-9bf03",
  storageBucket: "model-wave-458100-h7-9bf03.appspot.com",
  messagingSenderId: "1021678965111",
  appId: "1:1021678965111:web:8d2147a9fcc2359c771172",
  measurementId: "G-1WKSKDXLJE"
};

initializeApp(firebaseConfig);
const db = getFirestore();

const BUCKET_NAME = functions.config().gcp.storage_bucket;
const SUPABASE_URL = functions.config().supabase.url;
const SUPABASE_KEY = functions.config().supabase.key;
const CROSSMINT_URL = functions.config().crossmint.nft_url;
const CROSSMINT_KEY = functions.config().crossmint.server_key;
const DISCORD_WEBHOOK = functions.config().discord.webhook_url;

// Load card data from metadata.csv
const season0 = parse(fs.readFileSync('../public/metadata.csv', 'utf-8'), { columns: true });

// Get Public GCS Image URL
function getImageUrl(imagePath) {
  return `https://storage.googleapis.com/${BUCKET_NAME}/${imagePath}`;
}

// Mint Card
app.post('/mint', async (req, res) => {
  const { cardId, tribe, rareTrait, additionalAbility, wallet } = req.body;
  const card = season0.find(c => c.cardId === cardId);
  if (!card) return res.status(404).send('Card not found');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const serialNumber = (await supabase.from('Cards').select('serialNumber').order('serialNumber', { ascending: false }).limit(1)).data[0]?.serialNumber + 1 || 1;
  const imageUrl = getImageUrl(card.image.split('/').pop());

  try {
    const response = await axios.post(CROSSMINT_URL, {
      projectId: functions.config().crossmint.project_id,
      metadata: {
        name: card.name,
        image: imageUrl,
        description: card.flavor_text,
        attributes: [
          { trait_type: 'Tribe', value: tribe },
          { trait_type: 'Rarity', value: rareTrait || card.rarity || 'Common' },
          { trait_type: 'Ability', value: additionalAbility || 'None' },
        ],
      },
      recipient: `email:${wallet}:base`,
    }, {
      headers: { Authorization: `Bearer ${CROSSMINT_KEY}` },
    });

    const newCard = {
      id: response.data.id,
      cardId,
      season0Id: cardId,
      tribe,
      owner: wallet,
      serialNumber,
      rareTrait: rareTrait || card.rarity,
      additionalAbility,
      attack: parseInt(card.attack),
      health: parseInt(card.health),
      mana_cost: parseInt(card.cost),
      created_at: new Date().toISOString(),
    };

    await supabase.from('Cards').insert([newCard]);
    await axios.post(DISCORD_WEBHOOK, { content: `New card minted: ${card.name} (#${serialNumber}) by ${wallet}` });
    res.json(newCard);
  } catch (error) {
    console.error('Minting error:', error);
    res.status(500).send('Minting failed');
  }
});

// Auction Card
app.post('/auction', async (req, res) => {
  const { cardId, seller, startingBid, endTime } = req.body;
  const auction = {
    id: require('uuid').v4(),
    cardId,
    seller,
    startingBid,
    currentBid: startingBid,
    endTime,
    created_at: new Date().toISOString(),
  };

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    await supabase.from('Auctions').insert([auction]);
    await axios.post(DISCORD_WEBHOOK, { content: `New auction: Card ${cardId} by ${seller} with starting bid ${startingBid} $GBuX` });
    res.json(auction);
  } catch (error) {
    console.error('Auction error:', error);
    res.status(500).send('Auction creation failed');
  }
});

// Game State (PvP/PvE)
app.post('/game-state', async (req, res) => {
  const { gameId, playerId, boardState, turn } = req.body;
  const gameState = {
    id: require('uuid').v4(),
    gameId,
    playerId,
    boardState,
    turn,
    updated_at: new Date().toISOString(),
  };

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    await supabase.from('GameState').upsert([gameState]);
    res.json(gameState);
  } catch (error) {
    console.error('Game state error:', error);
    res.status(500).send('Game state update failed');
  }
});

// Discord Webhook
app.post('/discord', async (req, res) => {
  const { content } = req.body;
  try {
    await axios.post(DISCORD_WEBHOOK, { content });
    res.sendStatus(200);
  } catch (error) {
    console.error('Discord webhook error:', error);
    res.status(500).send('Webhook failed');
  }
});

exports.api = functions.https.onRequest(app);
