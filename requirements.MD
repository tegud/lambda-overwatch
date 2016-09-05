To run lambda overwatch you will need...

 - **3 x SNS Topics** - One to pass results to the function that works out how things went, then one for failures, and one for all completed results:
   - **resultComplete** - Once makeRequest completes, it will do the minimal processing and put it straight onto the resultComplete topic
   - **failedCheck** - Failed checks put straight onto here so we can send emails 
   - **completedCheck** - Completed checks get put onto this topic so we don't have to check in each topic whether it was a pass or fail if we care (saves on execution time if we don't trigger only to just ignore the message.
 - **IAM Roles for Accessing the Topics** - I have one per function, you may be fine having one for all three functions, but you'll need IAM roles which have permissions to execute lambda functions AND access the SNS topics above. You can create the roles through the lambda wizard, but you will need to add the SNS permissions. I also created another account with higher level access for the CircleCI pipeline later.
I ended up with the following roles:
   - **MakeRequest** - access to lambda function makeRequest and SNS topic: resultComplete
   - **ProcessResult** - access to the lambda function processResult and SNS topics: resultComplete, failedCheck, completedCheck
   - **SendToSlack** - access to the lambda function sendToSlack and SNS topic: completedCheck
