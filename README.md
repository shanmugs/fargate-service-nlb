# fargate-service-nlb
AWS CDK example with a ECS Fargate service


### Configure AWS creds 
$ aws configure

### Configure AWS CDK for typescript 
$ cdk init --language=typescript

### Build 
$ npm run build

### Check the cloud formation script
$ cdk synth

### Run and Deploy the infra
$ cdk deploy

### To clean up 
$ aws cloudformation delete-stack --stack-name search-api-service
