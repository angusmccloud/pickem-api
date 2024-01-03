# NFL Pick 'Em (API)
OLD: sls invoke local -f testerFunction --env production
 sls invoke local -f testerFunction --param="stage=prod"
 sls deploy --param="stage=prod"

# Change a user's password via CLI
aws cognito-idp admin-set-user-password --user-pool-id "us-east-1_Biu0dPvx6"  --username "kimmitchell-mellon" --password "PASSWORDHERE" --permanent