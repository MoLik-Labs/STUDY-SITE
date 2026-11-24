import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const { parseServiceAccount } = await import(pathToFileURL(path.join(HERE, '..', 'src', 'google-auth.js')).href);

const good = {
  type: 'service_account', project_id: 'study-focus-fox',
  client_email: 'api@study-focus-fox.iam.gserviceaccount.com',
  private_key: '-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----\n',
  private_key_id: 'x', token_uri: 'https://oauth2.googleapis.com/token',
};

test('nhận đúng tài khoản dịch vụ, chỉ giữ trường cần thiết', () => {
  const sa = parseServiceAccount(JSON.stringify(good));
  assert.deepEqual(Object.keys(sa).sort(), ['client_email', 'private_key', 'project_id']);
});

test('từ chối chuỗi rỗng, JSON hỏng, sai loại, email lạ, không có khoá', () => {
  assert.equal(parseServiceAccount(undefined), null);
  assert.equal(parseServiceAccount(''), null);
  assert.equal(parseServiceAccount('{không phải json đủ dài để qua kiểm tra độ dài tối thiểu'), null);
  assert.equal(parseServiceAccount(JSON.stringify({ ...good, type: 'authorized_user' })), null);
  assert.equal(parseServiceAccount(JSON.stringify({ ...good, client_email: 'nguoi@example.com' })), null);
  assert.equal(parseServiceAccount(JSON.stringify({ ...good, private_key: 'không phải khoá' })), null);
});
