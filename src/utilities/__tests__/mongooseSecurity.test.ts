import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { describe, it } from 'vitest'

// Test the Mongoose version resolved by Payload's MongoDB adapter, not a separate install.
const require = createRequire(import.meta.url)
const adapterRequire = createRequire(require.resolve('@payloadcms/db-mongodb'))
const mongoosePath = adapterRequire.resolve('mongoose')

// Isolate prototype-pollution regressions so a vulnerable dependency cannot corrupt Vitest.
const check = (body: string) => {
  execFileSync(
    process.execPath,
    [
      '-e',
      `const assert = require('node:assert/strict');
       const mongoose = require(${JSON.stringify(mongoosePath)});
       (async () => { ${body} })().catch(error => { console.error(error); process.exit(1); });`,
    ],
    { timeout: 10_000 },
  )
}

describe('Mongoose security regressions', () => {
  it('sanitizes countDocuments filters when enabled per query (GHSA-pcrw-h46h-c93h)', () => {
    check(`
      const Model = mongoose.model('CountSecurity', new mongoose.Schema({ value: {} }));
      let captured;
      Model.collection.countDocuments = async filter => { captured = filter; return 0; };
      await Model.countDocuments({ value: { $ne: null } }).setOptions({ sanitizeFilter: true });
      assert.deepEqual(captured, { value: { $eq: { $ne: null } } });
    `)
  })

  it('honors connection-level sanitizeFilter (GHSA-gg4r-jv3p-qx3c)', () => {
    check(`
      const connection = mongoose.createConnection();
      // createClient stores the connection option here, without needing a live database.
      connection.config.sanitizeFilter = true;
      const Model = connection.model('ConnectionSecurity', new mongoose.Schema({ value: {} }));
      let captured;
      Model.collection.findOne = async filter => { captured = filter; return null; };
      await Model.findOne({ value: { $ne: null } });
      assert.deepEqual(captured, { value: { $eq: { $ne: null } } });
      Model.collection.countDocuments = async filter => { captured = filter; return 0; };
      await Model.countDocuments({ value: { $ne: null } });
      assert.deepEqual(captured, { value: { $eq: { $ne: null } } });
    `)
  })

  it.each([
    `new Model(JSON.parse('{"meta.toString.call":1}'));`,
    `Model.hydrate(JSON.parse('{"toString":{"call":1}}'));`,
    `Model.findOneAndReplace({}, JSON.parse('{"toString":{"call":1}}'));`,
  ])('does not overwrite inherited built-ins (GHSA-8332-j7wj-wjw4): %s', (operation) => {
    check(`
      const Model = mongoose.model('PrototypeSecurity', new mongoose.Schema({ meta: {} }));
      ${operation}
      assert.equal(Object.prototype.toString.call, Function.prototype.call);
    `)
  })

  it('protects shared subdocument validators (GHSA-8332-j7wj-wjw4)', () => {
    check(`
      const Model = mongoose.model('SchemaSecurity', new mongoose.Schema({
        profile: new mongoose.Schema({ email: { type: String, required: true } }, { strict: false }),
      }));
      new Model({ profile: { email: 'a@b.c' } }).set('profile.$__schema.paths.email.validators', []);
      await assert.rejects(new Model({ profile: {} }).validate(), /required/);
    `)
  })
})
