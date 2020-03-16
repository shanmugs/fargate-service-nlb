"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ecs = require("@aws-cdk/aws-ecs");
const ec2 = require("@aws-cdk/aws-ec2");
const cdk = require("@aws-cdk/core");
const aws_elasticloadbalancingv2_1 = require("@aws-cdk/aws-elasticloadbalancingv2");
const aws_iam_1 = require("@aws-cdk/aws-iam");
const aws_logs_1 = require("@aws-cdk/aws-logs");
const aws_ec2_1 = require("@aws-cdk/aws-ec2");
class FargateServiceNLB extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        //1. Create VPC
        var vpc;
        vpc = new ec2.Vpc(this, 'Vpc', { maxAzs: 2 });
        //2. Creation of Execution Role for our task
        const execRole = new aws_iam_1.Role(this, 'search-api-exec-role', {
            roleName: 'social-api-role', assumedBy: new aws_iam_1.ServicePrincipal('ecs-tasks.amazonaws.com')
        });
        //3. Adding permissions to the above created role...basically giving permissions to ECR image and Cloudwatch logs
        execRole.addToPolicy(new aws_iam_1.PolicyStatement({
            actions: [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ], effect: aws_iam_1.Effect.ALLOW, resources: ["*"]
        }));
        //4. Create the ECS fargate cluster
        const cluster = new ecs.Cluster(this, 'social-api-cluster', { vpc, clusterName: "social-api-cluster" });
        //5. Create a task definition for our cluster to invoke a task
        const taskDef = new ecs.FargateTaskDefinition(this, "search-api-task", {
            family: 'search-api-task',
            memoryLimitMiB: 512,
            cpu: 256,
            executionRole: execRole,
            taskRole: execRole
        });
        //6. Create log group for our task to put logs
        const lg = aws_logs_1.LogGroup.fromLogGroupName(this, 'search-api-log-group', '/ecs/search-api-task');
        const log = new ecs.AwsLogDriver({
            logGroup: lg ? lg : new aws_logs_1.LogGroup(this, 'search-api-log-group', { logGroupName: '/ecs/search-api-task'
            }),
            streamPrefix: 'ecs'
        });
        //7. Create container for the task definition from ECR image
        var container = taskDef.addContainer("search-api-container", {
            image: ecs.ContainerImage.fromRegistry("487213271675.dkr.ecr.us-west-2.amazonaws.com/search-api:latest"),
            logging: log
        });
        //8. Add port mappings to your container...Make sure you use TCP protocol for Network Load Balancer (NLB)
        container.addPortMappings({
            containerPort: 7070,
            hostPort: 7070,
            protocol: ecs.Protocol.TCP
        });
        //9. Create the NLB using the above VPC.
        const lb = new aws_elasticloadbalancingv2_1.NetworkLoadBalancer(this, 'search-api-nlb', {
            loadBalancerName: 'search-api-nlb',
            vpc,
            internetFacing: false
        });
        //10. Add a listener on a particular port for the NLB
        const listener = lb.addListener('search-api-listener', {
            port: 7070,
        });
        //11. Create your own security Group using VPC
        const secGroup = new aws_ec2_1.SecurityGroup(this, 'search-api-sg', {
            securityGroupName: "search-sg",
            vpc: vpc,
            allowAllOutbound: true
        });
        //12. Add IngressRule to access the docker image on 80 and 7070 ports 
        secGroup.addIngressRule(ec2.Peer.ipv4('0.0.0.0/0'), ec2.Port.tcp(80), 'SSH frm anywhere');
        secGroup.addIngressRule(ec2.Peer.ipv4('0.0.0.0/0'), ec2.Port.tcp(7070), '');
        //13. Create Fargate Service from cluster, task definition and the security group
        const fargateService = new ecs.FargateService(this, 'search-api-fg-service', {
            cluster,
            taskDefinition: taskDef,
            assignPublicIp: true,
            serviceName: "search-api-svc",
            securityGroup: secGroup
        });
        //14. Add fargate service to the listener 
        listener.addTargets('search-api-tg', {
            targetGroupName: 'search-api-tg',
            port: 7070,
            targets: [fargateService],
            deregistrationDelay: cdk.Duration.seconds(360)
        });
        new cdk.CfnOutput(this, 'ClusterARN: ', { value: cluster.clusterArn });
    }
}
const app = new cdk.App();
new FargateServiceNLB(app, 'search-api-service');
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHdDQUF5QztBQUN6Qyx3Q0FBeUM7QUFDekMscUNBQXNDO0FBQ3RDLG9GQUEwRTtBQUMxRSw4Q0FBbUY7QUFDbkYsZ0RBQTZDO0FBQzdDLDhDQUFpRDtBQUNqRCxNQUFNLGlCQUFrQixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQ3ZDLFlBQVksS0FBYyxFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM1RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixlQUFlO1FBQ2YsSUFBSSxHQUFHLENBQUM7UUFDUixHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUU5Qyw0Q0FBNEM7UUFDNUMsTUFBTSxRQUFRLEdBQUcsSUFBSSxjQUFJLENBQUMsSUFBSSxFQUFFLHNCQUFzQixFQUFFO1lBQ3RELFFBQVEsRUFBRSxpQkFBaUIsRUFBRSxTQUFTLEVBQUUsSUFBSSwwQkFBZ0IsQ0FBQyx5QkFBeUIsQ0FBQztTQUN4RixDQUFDLENBQUE7UUFDRixpSEFBaUg7UUFDakgsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLHlCQUFlLENBQUM7WUFDdkMsT0FBTyxFQUFFO2dCQUNQLDJCQUEyQjtnQkFDM0IsaUNBQWlDO2dCQUNqQyw0QkFBNEI7Z0JBQzVCLG1CQUFtQjtnQkFDbkIsc0JBQXNCO2dCQUN0QixtQkFBbUI7YUFDcEIsRUFBRSxNQUFNLEVBQUUsZ0JBQU0sQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUMsR0FBRyxDQUFDO1NBQzFDLENBQUMsQ0FBQyxDQUFDO1FBRUosbUNBQW1DO1FBQ25DLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUs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aEMsSUFBSSxFQUFFLElBQUk7WUFDVixPQUFPLEVBQUUsQ0FBQyxjQUFjLENBQUM7WUFDekIsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDO1NBQy9DLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO0lBQ3pFLENBQUM7Q0FDRjtBQUVELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLElBQUksaUJBQWlCLENBQUMsR0FBRyxFQUFFLG9CQUFvQixDQUFDLENBQUM7QUFFakQsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGVjcyA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2F3cy1lY3MnKTtcbmltcG9ydCBlYzIgPSByZXF1aXJlKCdAYXdzLWNkay9hd3MtZWMyJyk7XG5pbXBvcnQgY2RrID0gcmVxdWlyZSgnQGF3cy1jZGsvY29yZScpO1xuaW1wb3J0IHsgTmV0d29ya0xvYWRCYWxhbmNlciB9IGZyb20gJ0Bhd3MtY2RrL2F3cy1lbGFzdGljbG9hZGJhbGFuY2luZ3YyJztcbmltcG9ydCB7IFJvbGUsIFNlcnZpY2VQcmluY2lwYWwsIFBvbGljeVN0YXRlbWVudCwgRWZmZWN0IH0gZnJvbSAnQGF3cy1jZGsvYXdzLWlhbSc7XG5pbXBvcnQgeyBMb2dHcm91cCB9IGZyb20gJ0Bhd3MtY2RrL2F3cy1sb2dzJztcbmltcG9ydCB7IFNlY3VyaXR5R3JvdXAgfSBmcm9tICdAYXdzLWNkay9hd3MtZWMyJztcbmNsYXNzIEZhcmdhdGVTZXJ2aWNlTkxCIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IGNkay5BcHAsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcbiAgICBcbiAgICAvLzEuIENyZWF0ZSBWUENcbiAgICB2YXIgdnBjO1xuICAgIHZwYyA9IG5ldyBlYzIuVnBjKHRoaXMsICdWcGMnLCB7IG1heEF6czogMiB9KTtcbiAgICBcbiAgICAvLzIuIENyZWF0aW9uIG9mIEV4ZWN1dGlvbiBSb2xlIGZvciBvdXIgdGFza1xuICAgIGNvbnN0IGV4ZWNSb2xlID0gbmV3IFJvbGUodGhpcywgJ3NlYXJjaC1hcGktZXhlYy1yb2xlJywge1xuICAgICAgcm9sZU5hbWU6ICdzb2NpYWwtYXBpLXJvbGUnLCBhc3N1bWVkQnk6IG5ldyBTZXJ2aWNlUHJpbmNpcGFsKCdlY3MtdGFza3MuYW1hem9uYXdzLmNvbScpXG4gICAgfSlcbiAgICAvLzMuIEFkZGluZyBwZXJtaXNzaW9ucyB0byB0aGUgYWJvdmUgY3JlYXRlZCByb2xlLi4uYmFzaWNhbGx5IGdpdmluZyBwZXJtaXNzaW9ucyB0byBFQ1IgaW1hZ2UgYW5kIENsb3Vkd2F0Y2ggbG9nc1xuICAgIGV4ZWNSb2xlLmFkZFRvUG9saWN5KG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgYWN0aW9uczogW1xuICAgICAgICBcImVjcjpHZXRBdXRob3JpemF0aW9uVG9rZW5cIixcbiAgICAgICAgXCJlY3I6QmF0Y2hDaGVja0xheWVyQXZhaWxhYmlsaXR5XCIsXG4gICAgICAgIFwiZWNyOkdldERvd25sb2FkVXJsRm9yTGF5ZXJcIixcbiAgICAgICAgXCJlY3I6QmF0Y2hHZXRJbWFnZVwiLFxuICAgICAgICBcImxvZ3M6Q3JlYXRlTG9nU3RyZWFtXCIsXG4gICAgICAgIFwibG9nczpQdXRMb2dFdmVudHNcIlxuICAgICAgXSwgZWZmZWN0OiBFZmZlY3QuQUxMT1csIHJlc291cmNlczogW1wiKlwiXVxuICAgIH0pKTtcblxuICAgIC8vNC4gQ3JlYXRlIHRoZSBFQ1MgZmFyZ2F0ZSBjbHVzdGVyXG4gICAgY29uc3QgY2x1c3RlciA9IG5ldyBlY3MuQ2x1c3Rlcih0aGlzLCAnc29jaWFsLWFwaS1jbHVzdGVyJywgeyB2cGMsIGNsdXN0ZXJOYW1lOiBcInNvY2lhbC1hcGktY2x1c3RlclwiIH0pO1xuXG4gICAgLy81LiBDcmVhdGUgYSB0YXNrIGRlZmluaXRpb24gZm9yIG91ciBjbHVzdGVyIHRvIGludm9rZSBhIHRhc2tcbiAgICBjb25zdCB0YXNrRGVmID0gbmV3IGVjcy5GYXJnYXRlVGFza0RlZmluaXRpb24odGhpcywgXCJzZWFyY2gtYXBpLXRhc2tcIiwge1xuICAgICAgZmFtaWx5OiAnc2VhcmNoLWFwaS10YXNrJyxcbiAgICAgIG1lbW9yeUxpbWl0TWlCOiA1MTIsXG4gICAgICBjcHU6IDI1NixcbiAgICAgIGV4ZWN1dGlvblJvbGU6IGV4ZWNSb2xlLFxuICAgICAgdGFza1JvbGU6IGV4ZWNSb2xlXG4gICAgfSk7XG5cbiAgICAvLzYuIENyZWF0ZSBsb2cgZ3JvdXAgZm9yIG91ciB0YXNrIHRvIHB1dCBsb2dzXG4gICAgY29uc3QgbGcgPSBMb2dHcm91cC5mcm9tTG9nR3JvdXBOYW1lKHRoaXMsICdzZWFyY2gtYXBpLWxvZy1ncm91cCcsICAnL2Vjcy9zZWFyY2gtYXBpLXRhc2snKTtcbiAgICBjb25zdCBsb2cgPSBuZXcgZWNzLkF3c0xvZ0RyaXZlcih7XG4gICAgICBsb2dHcm91cCA6IGxnPyBsZyA6IG5ldyBMb2dHcm91cCh0aGlzLCAnc2VhcmNoLWFwaS1sb2ctZ3JvdXAnLHtsb2dHcm91cE5hbWU6Jy9lY3Mvc2VhcmNoLWFwaS10YXNrJ1xuICAgICAgfSksXG4gICAgICBzdHJlYW1QcmVmaXggOiAnZWNzJ1xuICAgIH0pXG5cbiAgICAvLzcuIENyZWF0ZSBjb250YWluZXIgZm9yIHRoZSB0YXNrIGRlZmluaXRpb24gZnJvbSBFQ1IgaW1hZ2VcbiAgICB2YXIgY29udGFpbmVyID0gdGFza0RlZi5hZGRDb250YWluZXIoXCJzZWFyY2gtYXBpLWNvbnRhaW5lclwiLCB7XG4gICAgICBpbWFnZTogZWNzLkNvbnRhaW5lckltYWdlLmZyb21SZWdpc3RyeShcIjQ4NzIxMzI3MTY3NS5ka3IuZWNyLnVzLXdlc3QtMi5hbWF6b25hd3MuY29tL3NlYXJjaC1hcGk6bGF0ZXN0XCIpLFxuICAgICAgbG9nZ2luZzpsb2dcbiAgICB9KVxuXG4gICAgLy84LiBBZGQgcG9ydCBtYXBwaW5ncyB0byB5b3VyIGNvbnRhaW5lci4uLk1ha2Ugc3VyZSB5b3UgdXNlIFRDUCBwcm90b2NvbCBmb3IgTmV0d29yayBMb2FkIEJhbGFuY2VyIChOTEIpXG4gICAgY29udGFpbmVyLmFkZFBvcnRNYXBwaW5ncyh7XG4gICAgICBjb250YWluZXJQb3J0OiA3MDcwLFxuICAgICAgaG9zdFBvcnQ6IDcwNzAsXG4gICAgICBwcm90b2NvbDogZWNzLlByb3RvY29sLlRDUFxuICAgIH0pO1xuXG4gICAgLy85LiBDcmVhdGUgdGhlIE5MQiB1c2luZyB0aGUgYWJvdmUgVlBDLlxuICAgIGNvbnN0IGxiID0gbmV3IE5ldHdvcmtMb2FkQmFsYW5jZXIodGhpcywgJ3NlYXJjaC1hcGktbmxiJywge1xuICAgICAgbG9hZEJhbGFuY2VyTmFtZTogJ3NlYXJjaC1hcGktbmxiJyxcbiAgICAgIHZwYyxcbiAgICAgIGludGVybmV0RmFjaW5nOiBmYWxzZVxuICAgIH0pO1xuXG4gICAgLy8xMC4gQWRkIGEgbGlzdGVuZXIgb24gYSBwYXJ0aWN1bGFyIHBvcnQgZm9yIHRoZSBOTEJcbiAgICBjb25zdCBsaXN0ZW5lciA9IGxiLmFkZExpc3RlbmVyKCdzZWFyY2gtYXBpLWxpc3RlbmVyJywge1xuICAgICAgcG9ydDogNzA3MCxcbiAgICB9KTtcblxuICAgIC8vMTEuIENyZWF0ZSB5b3VyIG93biBzZWN1cml0eSBHcm91cCB1c2luZyBWUENcbiAgICBjb25zdCBzZWNHcm91cCA9IG5ldyBTZWN1cml0eUdyb3VwKHRoaXMsICdzZWFyY2gtYXBpLXNnJywge1xuICAgICAgc2VjdXJpdHlHcm91cE5hbWU6IFwic2VhcmNoLXNnXCIsXG4gICAgICB2cGM6dnBjLFxuICAgICAgYWxsb3dBbGxPdXRib3VuZDp0cnVlXG4gICAgfSk7XG5cbiAgICAvLzEyLiBBZGQgSW5ncmVzc1J1bGUgdG8gYWNjZXNzIHRoZSBkb2NrZXIgaW1hZ2Ugb24gODAgYW5kIDcwNzAgcG9ydHMgXG4gICAgc2VjR3JvdXAuYWRkSW5ncmVzc1J1bGUoZWMyLlBlZXIuaXB2NCgnMC4wLjAuMC8wJyksIGVjMi5Qb3J0LnRjcCg4MCksICdTU0ggZnJtIGFueXdoZXJlJyk7XG4gICAgc2VjR3JvdXAuYWRkSW5ncmVzc1J1bGUoZWMyLlBlZXIuaXB2NCgnMC4wLjAuMC8wJyksIGVjMi5Qb3J0LnRjcCg3MDcwKSwgJycpO1xuXG4gICAgLy8xMy4gQ3JlYXRlIEZhcmdhdGUgU2VydmljZSBmcm9tIGNsdXN0ZXIsIHRhc2sgZGVmaW5pdGlvbiBhbmQgdGhlIHNlY3VyaXR5IGdyb3VwXG4gICAgY29uc3QgZmFyZ2F0ZVNlcnZpY2UgPSBuZXcgZWNzLkZhcmdhdGVTZXJ2aWNlKHRoaXMsICdzZWFyY2gtYXBpLWZnLXNlcnZpY2UnLCB7XG4gICAgICBjbHVzdGVyLFxuICAgICAgdGFza0RlZmluaXRpb246IHRhc2tEZWYsIFxuICAgICAgYXNzaWduUHVibGljSXA6IHRydWUsIFxuICAgICAgc2VydmljZU5hbWU6IFwic2VhcmNoLWFwaS1zdmNcIixcbiAgICAgIHNlY3VyaXR5R3JvdXA6c2VjR3JvdXBcbiAgICB9KTtcblxuICAgIC8vMTQuIEFkZCBmYXJnYXRlIHNlcnZpY2UgdG8gdGhlIGxpc3RlbmVyIFxuICAgIGxpc3RlbmVyLmFkZFRhcmdldHMoJ3NlYXJjaC1hcGktdGcnLCB7XG4gICAgICB0YXJnZXRHcm91cE5hbWU6ICdzZWFyY2gtYXBpLXRnJyxcbiAgICAgIHBvcnQ6IDcwNzAsXG4gICAgICB0YXJnZXRzOiBbZmFyZ2F0ZVNlcnZpY2VdLFxuICAgICAgZGVyZWdpc3RyYXRpb25EZWxheTogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzYwKVxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0NsdXN0ZXJBUk46ICcsIHsgdmFsdWU6IGNsdXN0ZXIuY2x1c3RlckFybiB9KTtcbiAgfVxufVxuXG5jb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuXG5uZXcgRmFyZ2F0ZVNlcnZpY2VOTEIoYXBwLCAnc2VhcmNoLWFwaS1zZXJ2aWNlJyk7XG5cbmFwcC5zeW50aCgpO1xuIl19