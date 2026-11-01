#!/usr/bin/env node
/**
 * Interactive one-time administrator provisioning.
 * Run inside the application container: node scripts/create-admin.js
 * Does not reset, seed, or modify existing users.
 */
const readline = require('node:readline');
const { db } = require('../lib/db');
const { hashPassword } = require('../lib/auth');

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => {
    rl.close();
    resolve(answer.trim());
  }));
}

function askHidden(question) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
      reject(new Error('Password prompt requires an interactive TTY.'));
      return;
    }
    const stdin = process.stdin;
    let value = '';
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    const onData = chunk => {
      for (const byte of chunk) {
        if (byte === 3) {
          cleanup();
          reject(new Error('Cancelled.'));
          return;
        }
        if (byte === 13 || byte === 10) {
          process.stdout.write('\n');
          cleanup();
          resolve(value);
          return;
        }
        if (byte === 127 || byte === 8) {
          if (value.length) value = value.slice(0, -1);
          continue;
        }
        if (byte >= 32 && byte <= 126) value += String.fromCharCode(byte);
      }
    };
    function cleanup() {
      stdin.removeListener('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
    }
    stdin.on('data', onData);
  });
}

async function main() {
  const name = await ask('Administrator full name: ');
  const email = (await ask('Administrator email: ')).toLowerCase();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('A name and valid email address are required.');
  }

  const existing = db.prepare('SELECT id, role FROM users WHERE lower(email) = lower(?)').get(email);
  if (existing) {
    throw new Error(`Account already exists (id=${existing.id}, role=${existing.role}). No changes made.`);
  }

  const password = await askHidden('Password (12+ chars; input hidden): ');
  const confirm = await askHidden('Confirm password: ');
  if (password !== confirm) throw new Error('Passwords do not match.');
  if (password.length < 12) throw new Error('Password must be at least 12 characters.');

  const { hash, salt } = hashPassword(password);
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = db.prepare(
      'INSERT INTO users (email, password_hash, salt, name, role, mfa_enabled) VALUES (?, ?, ?, ?, ?, 0)'
    ).run(email, hash, salt, name, 'admin');
    db.prepare(
      'INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(Number(result.lastInsertRowid), email, 'admin_account_provisioned', 'user', String(result.lastInsertRowid), 'Initial administrator account created via one-time CLI');
    db.exec('COMMIT');
    console.log(`Created administrator account for ${email} (id=${result.lastInsertRowid}).`);
    console.log('Sign in at https://assistacorp.com/login and enroll MFA immediately.');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

main().catch(error => {
  console.error('Admin provisioning failed:', error.message);
  process.exitCode = 1;
});
