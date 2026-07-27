#!/usr/bin/env node
/**
 * Migration 1.3 - deplacer role/client_id de user_metadata vers app_metadata.
 *
 * Depuis le correctif 1.3, le serveur ne lit plus que app_metadata pour decider
 * du role et du client_id (user_metadata est modifiable par l'utilisateur lui-meme
 * depuis le navigateur). Les comptes crees avant que app_metadata soit rempli
 * perdraient leur acces. Ce script recopie les valeurs manquantes.
 *
 * Lancement (mode lecture seule par defaut):
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-metadata-to-app.js
 * Pour ecrire reellement:
 *   ... node scripts/migrate-metadata-to-app.js --apply
 */

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const APPLY = process.argv.includes("--apply");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function pick(meta, keys) {
  for (const key of keys) {
    const value = String(meta?.[key] || "").trim();
    if (value) return value;
  }
  return "";
}

async function listAllUsers() {
  const users = [];
  let page = 1;

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const batch = data?.users || [];
    users.push(...batch);
    if (batch.length < 200) break;
    page += 1;
  }

  return users;
}

(async () => {
  const users = await listAllUsers();
  console.log(`${users.length} comptes trouves. Mode: ${APPLY ? "APPLY" : "lecture seule"}\n`);

  let changed = 0;

  for (const user of users) {
    const userMeta = user.user_metadata || {};
    const appMeta = user.app_metadata || {};

    const currentRole = pick(appMeta, ["role"]);
    const currentClientId = pick(appMeta, ["client_id", "clientId"]);
    const legacyRole = pick(userMeta, ["role"]);
    const legacyClientId = pick(userMeta, ["client_id", "clientId"]);

    const patch = {};
    if (!currentRole && legacyRole) patch.role = legacyRole;
    if (!currentClientId && legacyClientId) patch.client_id = legacyClientId;

    if (!Object.keys(patch).length) continue;

    changed += 1;
    console.log(`${user.email}  ->  ${JSON.stringify(patch)}`);

    if (APPLY) {
      const { error } = await admin.auth.admin.updateUserById(user.id, {
        app_metadata: { ...appMeta, ...patch }
      });
      if (error) console.error(`  ECHEC ${user.email}: ${error.message}`);
    }
  }

  console.log(`\n${changed} compte(s) ${APPLY ? "migres" : "a migrer"}.`);

  const orphans = users.filter((user) => {
    const role = pick(user.app_metadata || {}, ["role"]);
    const clientId = pick(user.app_metadata || {}, ["client_id", "clientId"]);
    const legacyRole = pick(user.user_metadata || {}, ["role"]);
    return legacyRole === "client" && !(role === "client" && clientId);
  });

  if (orphans.length) {
    console.log("\nATTENTION, comptes client sans client_id exploitable apres migration:");
    orphans.forEach((user) => console.log(`  ${user.email} (${user.id})`));
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
