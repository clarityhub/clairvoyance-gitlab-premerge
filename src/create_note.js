const request = require('request');
const fs = require('fs');
const path = require('path');

const gitlabUrl = 'https://gitlab.com';
const basePath = '/api/v4';

/**
 * POST /projects/:id/merge_requests/:merge_request_iid/notes
 */
function createNote(privateToken, projectId, mergeRequestId, message) {
  const path = gitlabUrl + basePath + '/projects/' + projectId + '/merge_requests/' +
   mergeRequestId + '/notes?private_token=' + privateToken;

  request.post(path, { form: { body: message } }, function (error, response, body) {
    if (error || response.statusCode >= 400) {
      console.log('error:', error); // Print the error if one occurred
      console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
      console.log('body:', body); // Print the HTML for the Google homepage.
    }
  });
}

/**
 * Make a message out of the terraform nonsense
 */
function makeNoteMessage(terraformResult) {
  console.log(terraformResult);

  const needle1 = 'Terraform can\'t guarantee this is what will execute.';
  const needle2 = 'Plan:';
  var i = terraformResult.indexOf(needle1) + needle1.length + 1;
  var j = terraformResult.indexOf(needle2);

  const details = terraformResult.slice(i, j).replace(/\[.*?m/g, '');

  const planRegex = /([0-9]+) to add, ([0-9]+) to change, ([0-9]+) to destroy/igm;
  const results = planRegex.exec(terraformResult, '');
  const add = parseInt(results[1], 10);
  const change = parseInt(results[2], 10);
  const destroy = parseInt(results[3], 10);

  return `
[![Create](https://img.shields.io/badge/create-${add}-${add > 0 ? 'green' : 'lightgrey'}.svg)]()
[![Modify](https://img.shields.io/badge/modify-${change}-${change > 0 ? 'yellow' : 'lightgrey'}.svg)]()
[![Destory](https://img.shields.io/badge/destroy-${destroy}-${destroy > 0 ? 'red' : 'lightgrey'}.svg)]()

🤖 It looks like this merge request will make the following changes:

\`\`\`
${details}
\`\`\`
`;
}


// Get command line parameters
const privateToken = process.argv[2];
const projectId = process.argv[3];
const mergeRequestId = process.argv[4];
const mergeRequestName = process.argv[5];
const terraformResult = fs.readFileSync(
  path.resolve(path.join(__dirname, '../plan.output')),
  'utf8'
);

const message = makeNoteMessage(terraformResult);

createNote(privateToken, projectId, mergeRequestId, message);
