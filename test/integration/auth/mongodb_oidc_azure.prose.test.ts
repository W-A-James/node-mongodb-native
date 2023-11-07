import { expect } from 'chai';

import { type Collection, MongoClient, type MongoClientOptions } from '../../mongodb';

const DEFAULT_URI = 'mongodb://127.0.0.1:27017';

describe('OIDC Auth Spec Azure Tests', function () {
  describe('Azure Automatic Auth', function () {
    let client: MongoClient;
    let collection: Collection;

    beforeEach(function () {
      if (!this.configuration.isOIDC(process.env.MONGODB_URI_SINGLE, 'azure')) {
        this.skipReason = 'Azure OIDC tests require an Azure OIDC environment.';
        this.skip();
      }
    });

    afterEach(async function () {
      await client?.close();
    });

    describe('Connect', function () {
      beforeEach(function () {
        const options: MongoClientOptions = {};
        if (process.env.AZUREOIDC_USERNAME) {
          options.auth = { username: process.env.AZUREOIDC_USERNAME, password: undefined };
        }
        if (process.env.AZUREOIDC_RESOURCE) {
          options.authMechanismProperties = { TOKEN_RESOURCE: process.env.AZUREOIDC_RESOURCE };
        }
        client = new MongoClient(process.env.MONGODB_URI_SINGLE ?? DEFAULT_URI, options);
        collection = client.db('test').collection('test');
      });

      // Assert that a find operation succeeds.
      // Close the client.
      it('successfully authenticates', async function () {
        const result = await collection.findOne();
        expect(result).to.not.be.null;
      });
    });
  });
});
