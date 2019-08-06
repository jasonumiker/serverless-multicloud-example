# Approaches for Serverless without Vendor Lock-in
By Jason Umiker

Both containers and serverless have been hot topics in cloud architecture circles for the last couple years. One of the main justifications I’ve heard for containerising, especially on Kubernetes, has been that it allows for more portability of a workload across clouds – more so than VMs and especially more so than serverless architectures. About half the time I hear this portability it is to “avoid vendor lock-in” and the other is based on the belief that you can build a more reliable service by facilitating the failover of the workload between clouds as a type of disaster recovery. I’ve been thinking quite a bit about these statements and want to challenge some of the assumptions that underpin them.

The key question here is whether you need to containerise a workload for it to be portable. I often hear this statement and didn’t challenge it, instead tending to question whether that portability was really necessary vs. all the benefits of centralising on one cloud platform. Then I read this blog post from Wisen Tanasa from ThoughtWorks - https://www.thoughtworks.com/insights/blog/mitigating-serverless-lock-fears. 
![Lock-in Equation](https://insights-images.thoughtworks.com/Insights20Diagram05_78362c25d5be66120fb7ff5373c64396.png)
![Adapter Diagram](https://insights-images.thoughtworks.com/Insights20Diagram_123030303_fad81aa4bf183563a8b4b42eba770d85.png)

It is a thought provoking discussion on software architectural approaches and possible trade-offs to balance or mitigate lock-in fears - while still realising the benefits of serverless and cloud. It made me seriously consider whether multi-cloud serverless is not just possible but practical. But, it didn’t have a concrete example or demo of doing it in practice. So, I set out to build one to see for myself just how hard it would be and what kind of limitations I’d encounter.

Working through it there were three considerations:
1. Can your function run in another cloud?
    1. Can you abstract any differences in how it’ll be invoked in the other cloud (the handler)?
    1.	Does the other cloud’s FaaS support the language/runtime (e.g. nodejs or golang)?
    1.	Does it use services/features not in the other cloud (e.g. AWS DynamoDB or GCP BigTable)?
1.	Do you need to substantially change your build/deployment pipeline or tooling to deploy it to another cloud?
1.	Can you migrate any/all required data between clouds – ideally between equivalent managed databases.
    1.	And to what extent can/should this be done to facilitate a DR failover between clouds?

## Can your function run in another cloud?

While each major cloud has a roughly comparable Function-as-a-Service (FaaS) service (AWS Lambda, GCP Cloud Functions, Azure Functions, etc.) they all invoke your function with a slightly different JSON payload. The part of your function that deals with parsing this payload and getting things going is called the handler – and running it across multiple clouds means making this handler work given either payload. You can either abstract the handler from the business logic and have two pluggable ones for the different clouds or write one handler that can handle either format. The good news is that for many languages/runtimes others have already done this work for you! This npm package is one such abstracted handler for a Node Express app that makes it support the payload of all three major clouds - https://www.npmjs.com/package/serverless-express.

When it comes to languages and runtimes the major clouds support several and finding one that works across two of them should be, if not easy, at least possible. In my example we’ll look at below I use the most recent version of Node.js with long-term support and all three major clouds supported it.

So that takes us to the most interesting of the lock-in discussions – depending on a Service only available in one of the clouds. This can often be appealing – cloud managed services for databases, queues, streams etc. can be very cost effective and save you from much of the operational effort yet are often only available in one of the clouds. There are two approaches to dealing with this: 
* You use them but abstract that usage into a separate file/function, what Tanasa calls an adapter, to facilitate swapping it out without needing to rewrite the core business logic of your microservice. 
* The other approach is choosing to use only those services that are open-sourced or available in the other cloud so you don’t need to write such adapters.

And, these are not mutually exclusive – you can do both where appropriate. When deciding which approach to take it is important to understand which services are available on your chosen clouds and what their APIs/SDKs are like. Often many of the clouds will have comparable services that just need to be called via a different SDKs – and as long as they both meet your requirements and are similar writing two adapters at the start might not be that difficult to just do together as you go. If it does look like it’ll be difficult, you could start with just the one adapter and flag the risk that moving means writing another adapter to something else as part of that migration effort. This one-adapter approach increases future migration cost in exchange for more short-term opportunity gain from just using the potentially cheaper and easier cloud service for now in the equation above. But we have our clear design and risk register so that risk is documented and quantifiable.

The other way of thinking is choosing either open-source or commercial services that can be run in both providers/platforms. A good example is using MongoDB instead of AWS DynamoDB (as we do in the example). Both AWS and Azure have a managed Mongo-compatible database - and you can even run it in a VM instead if you wanted. If we choose this, then we don’t even have to abstract the database functionality out to an adapter because it won’t hinder our migration efforts. This approach decreases migration cost in exchange for less opportunity gain from using the potentially cheaper and easier cloud service in the equation above.

## Do you need to substantially change your build/deployment pipeline or tooling to deploy it to another cloud?

Each cloud has infrastructure-as-code deployment tooling that is specific to it – e.g. AWS has CloudFormation and SAM, Azure has Resource Manager and Google has Cloud Deployment Manager. If you fully standardise on that tooling it means that you’ll need to change the tooling to migrate between clouds. There are at least two tools in this space that support all of the major clouds through –Serverless and Terraform. While the templates you’d make in these tools will vary a bit between clouds, standardising on a tool like that can help make migration more seamless. In the equation above this is the trade-off between migration cost and opportunity gain of having one vendor support both the cloud and its associated deployment tooling for you as a managed service.

## Can you migrate any required data between clouds – ideally between managed databases.

This question will depend on the type of datastore or databases that you use. If you can run the same database in both clouds then it stands to reason you can take a backup from it in one cloud and restore it to another. And, in some areas, the providers have rallied around a common standard – AWS’ S3 API is supported for object storage across all three major clouds for example. Even if the database engines vary tools like AWS’ Database Migration Service and Schema Conversion Tool can migrate from things like Mongo to Dynamo or Oracle to PostgreSQL – but it adds more complexity and uncertainty to the migration effort. 

### Can, and should, we continually replicate the data to the other cloud for DR?

If you were to use the same database in both clouds many of them support replication – so it is possible that we could enable replication, either synchronous or in an eventually-consistent way, from a primary to a secondary cloud. The assumption that underpins this is that you can achieve better availability by being able to flip between clouds – and that assumption is worth digging into.

In the case of a cloud like AWS the infrastructure is architected in a way to allow easy active/active high-availability between Availability Zones where nearly all of their managed services such as databases will automatically fail over to another zone for you. This is often more than enough to meet the availability/uptime goals of your application – and you add in exponentially more complexity to architect for such a replication and automatic failover between cloud providers. Not to mention that none of the managed database services in any of the cloud providers facilitate managed replication cross-cloud like they do within their own platforms - so this is something you’d have to build and run yourself.

If the main issue is showing that you could move between clouds if you had a business relationship with one go sour, or decided strategically you want to back another horse, then you often would have at least weeks, if not months, to migrate. So investing in a capability to do it in minutes at the drop of a hat is likely overkill.

## My suggested approach and example app

Given all of this, the approach that I would go with is to choose a primary cloud provider and run my application there in the most managed and highly available way. Then I can decide, based on my situation and the above equation balancing migration effort vs. opportunity gain, whether I leverage adapters in my code with single-cloud options or instead to use services I can get across multiple clouds as appropriate.

Once you either written the adapters to accommodate both clouds and/or have chosen options available in both, you can prove via an integration test in your continuous integration (CI) pipeline that the microservice can be deployed to two providers by actually doing it each build. This proves to you and your stakeholders that you could migrate if you ever want or need to in a very simple and affordable way.

### Demo
I have written a demo of a Node.js Express app that can be deployed to all three major clouds via Serverless back-ended onto a MongoDB. This means that the tooling to deploy is the same regardless of the cloud and so my pipelines, at least for deploying this app, would not need to change if I switched and helps facilitate an integration test where I deploy to both with the same tooling.

As for the database I have a choice of running a separate Mongo development environment in each or just calling the Mongo in one from the other (perhaps over a VPN link) – because I know that I could run the Mongo in the secondary cloud if I ever needed to and that isn’t what I am really testing in my integration test – I am testing my handler and the underlying FaaS service executing it.

The code is available here - https://github.com/jasonumiker/serverless-multicloud-example

This is an example of the service up in each cloud:
* AWS - https://sesallvxkb.execute-api.ap-southeast-2.amazonaws.com/dev/documents/all
* Azure - https://serverless-multicloud-example.azurewebsites.net/api/app/documents/all
* Google - https://asia-northeast1-serverless-multicloud-example.cloudfunctions.net/handler/documents/all

## Conclusion

I now believe that it is possible to architect applications that are serverless yet portable – and to prove that portability every build with a deployment to both and subsequent integration test. What isn’t necessary, or perhaps even possible, is attempting to achieve a better availability by continual replication or automatic failover between clouds – you can likely achieve the availability you want at much lower cost and complexity in one. This is because the simpler something is, and the fewer moving parts and parties involved, the less likely that you’ll have availability issues and the easier they’ll be to troubleshoot if you ever do.

In the conversations I’ve had recently people are building very complex and expensive Kubernetes container environments, with associated container CI/CD pipelines, mainly for portability. It is worth at least considering whether it is possible to move up one level of abstraction to the major providers’ serverless Function-as-a-Service (FaaS) offerings and still be portable but with lower cost and cognitive load – letting you focus more on your business logic and customer outcomes. A few simple yet deliberate software architecture decisions around what services to use and when to decouple functions and add adapters can help pave the way for portability in the future if/when you do need it – while keeping it inexpensive and simple for you today.
