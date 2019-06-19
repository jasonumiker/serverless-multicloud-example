# serverless-multicloud-example
An example Node Express app that can be deployed multicloud by the Serverless framework. The differences in handler for each serverless service is abstracted by the serverless-express package.

Copy the relevant severless-xxx.yml file for the cloud you want (AWS, GCP or Azure) to serverless.yml and do a sls deploy.

Note that for GCP some initial setup is required as described here - https://serverless.com/framework/docs/providers/google/guide/credentials/. The other clouds you just need valid login details and CLIs configured to proceed.
