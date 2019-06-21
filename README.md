# serverless-multicloud-example
An example Node Express app that can be deployed in any of the major clouds by the Serverless framework. The differences in handler for each serverless service is abstracted by the serverless-express package - which has been isolated in handler.js leaving app.js for our cloud-agnostic business logic.

I intend for it to be a working example of the concepts discussed here - https://www.thoughtworks.com/insights/blog/mitigating-serverless-lock-fears

Copy the relevant severless-xxx.yml file for the cloud you want (AWS, GCP or Azure) to serverless.yml and do a sls deploy.

You also need to provide an Internet-facing Mongo URL via environment variable in the serverless-xxx.yml file to use the Mongo CRUD functionality.

Note that for GCP some initial setup is required as described here - https://serverless.com/framework/docs/providers/google/guide/credentials/. The other clouds you just need valid login details and CLIs configured to proceed.
