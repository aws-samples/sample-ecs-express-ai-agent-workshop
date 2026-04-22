# OIDC Setup

One-time setup for AWS. This creates a trust relationship between GitHub's OIDC token issuer and your AWS account.

## AWS: IAM OIDC Provider + IAM Role

1. **Create the OIDC identity provider:**

   ```sh
   aws iam create-open-id-connect-provider \
     --url https://token.actions.githubusercontent.com \
     --client-id-list sts.amazonaws.com \
     --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
   ```

   > **Note:** Since July 2023, AWS has added GitHub to its trusted root CAs, so the thumbprint value is no longer validated ([announcement](https://github.blog/changelog/2023-07-13-github-actions-oidc-integration-with-aws-no-longer-requires-pinning-of-intermediate-tls-certificates/)). The `--thumbprint-list` parameter is still required by the CLI, but the value is effectively ignored.

2. **Create an IAM role with a trust policy:**

   Create `trust-policy.json` (replace `ACCOUNT_ID` and `OWNER/REPO`):

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
         },
         "Action": "sts:AssumeRoleWithWebIdentity",
         "Condition": {
           "StringEquals": {
             "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
           },
           "StringLike": {
             "token.actions.githubusercontent.com:sub": "repo:OWNER/REPO:*"
           }
         }
       }
     ]
   }
   ```

   ```sh
   aws iam create-role \
     --role-name github-actions-iac \
     --assume-role-policy-document file://trust-policy.json
   ```

3. **Attach permissions.** The role needs access to: S3 (state backend), ECR, ECS, VPC, RDS, IAM (for ECS execution roles).

4. **Set the variable:** Add `AWS_IAM_ROLE_ARN` to GitHub Actions variables.

**Tip:** For tighter control, restrict the `sub` condition to specific branches or environments, e.g. `repo:OWNER/REPO:ref:refs/heads/main` or `repo:OWNER/REPO:environment:persistent`.
