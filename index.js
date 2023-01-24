
//#region refs
'use strict';

const {dialogflow, SignIn, Suggestions} = require('actions-on-google');
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer'); //reqd for all email sending

dotenv.config();
admin.initializeApp();

const app = dialogflow({  
  clientId: '367737336267-2s94t1t9qetlu788rhodarl19b21cbvs.apps.googleusercontent.com', //get from aog |proj|develop|account linking|edit icon
  debug: true
});

const runtimeOpts = {
  timeoutSeconds: 300,
  memory: '512MB'
}

//#endregion refs


//#region express webserver wrapper to bus-logic 

const express = require("express");
const bodyParser = require("body-parser");

const restService = express();

restService.use(
  bodyParser.urlencoded({
    extended: true
  })
);

restService.use(bodyParser.json());

//  expres app test route (GET). this give testsignal for simple conn to service as get eg by webpage call
restService.get("/", (req, res) => {
  res.send("CONFIRMED RECEIPT OF GET FMC1");
});

//  expres app test route (GET). this give testsignal for simple conn to service as get eg by webpage call
restService.get("/scratch/test.htm", (req, res) => {
  res.send("CONFIRMED RECEIPT OF test.htm.");
});

//make directories available to serve content
//restService.use('/.well-known', express.static('.well-known'));
restService.use('/scratch', express.static('scratch'));


 restService.get('/.well-known/pki-validation/63746AE1A022E460DA291AED6F40DE09.txt', (req, res) => {
   const filePath = `${__dirname}/.well-known/pki-validation/63746AE1A022E460DA291AED6F40DE09.txt`;
   res.download(filePath);
 });



restService.post("/fmc", app);

//simpler testsignal mtd and demo of using req,res format as often used in democode
restService.post("/echo", function(req, res) {
  //var speech = "What do you mean ";
   var speech = "What do you mean? " &&
     req.body.queryResult &&
     req.body.queryResult.parameters &&
     req.body.queryResult.parameters.echoText
       ? req.body.queryResult.parameters.echoText
       : "Seems like some problem. Speak again.";
  
  var speechResponse = {
    google: {
      expectUserResponse: true,
      richResponse: {
        items: [
          {
            simpleResponse: {
              textToSpeech: speech
            }
          }
        ]
      }
    }
  };
  
  return res.json({
    payload: speechResponse,
    //data: speechResponse,
    fulfillmentText: speech,
    speech: speech,
    displayText: speech,
    source: "webhook-echo-sample"
  });
});

restService.listen(process.env.PORT || 5002, function() {
  console.log("Server up and listening");
});

//#endregion express webserver wrapper to bus-logic 


//#region web-hook-slot-filling intent
  let sIndustry           = '';
  let sDeliveryLocation   = '';
  let sClassTime          = '';
  let iQualificationLevel = '';
  let sLearnerLocation    = '';
  let sEmailAddress       = '';
  let sQuestion = '';
  let sLastQuestion = '';
  let sChecker = '';

  app.intent('Restart', async (conv, params) =>  {

    sIndustry           = '';
    sDeliveryLocation   = '';
    sClassTime          = '';
    iQualificationLevel = '';
    sLearnerLocation    = '';
    sEmailAddress       = '';
    sQuestion           = '';
    sLastQuestion       = '';
    sChecker            = '';


    conv.contexts.set('searchSmartStart', 1);
    conv.ask('Start again? ');
  })


app.intent('SearchSmart', async (conv, params) =>  {
  
  //debug chk execution time
  var chkHrstart = process.hrtime()
      
  if (sQuestion == 'What Industry? ') {    
    sIndustry = params.Industry    
  } else if (sQuestion == 'What DeliveryLocation? ') {
    sDeliveryLocation = params.DeliveryLocation
  } else if (sQuestion == 'What ClassTime? ') {
    sClassTime = params.ClassTime
  } else if ( sQuestion == 'What QualificationLevel? ') {
    iQualificationLevel = params.QualificationLevel    
  } else if (sQuestion == 'What LearnerLocation? ') {
    sLearnerLocation = params.LearnerLocation
  } else {    
    sQuestion = 'All done '  
  }

  if (sIndustry=='') {    
    sQuestion = 'What Industry? '
  } else if (sDeliveryLocation=='') {
    sQuestion = 'What DeliveryLocation? '
  } else if (sClassTime=='') {
    sQuestion = 'What ClassTime? '
  } else if (iQualificationLevel=='') {
    sQuestion = 'What QualificationLevel? '
  } else if (sLearnerLocation=='') {
    sQuestion = 'What LearnerLocation? '  
  } else {    
    sQuestion = 'All done '  
  }

  let ssay = '';
  ssay= ssay + ' Industry           ' + sIndustry           ;
  ssay= ssay + ' DeliveryLocation   ' + sDeliveryLocation   ;
  ssay= ssay + ' ClassTime          ' + sClassTime          ;
  ssay= ssay + ' QualificationLevel ' + iQualificationLevel ;
  ssay= ssay + ' LearnerLocation    ' + sLearnerLocation    ;
  
  conv.ask('search start ' + ssay + sQuestion);     
  //conv.ask('search start ' + conv.body.queryResult.queryText);  

  let sEmailQuestion = ". Would you like an email of the results?  ";
  
 //debug chk execution time
 var chkhrend = process.hrtime(chkHrstart);
 console.log('1 Execution time (hr): %ds %dms', chkhrend[0], chkhrend[1] / 1000000);

})

//#endregion web-hook-slot-filling intent


//#region intent handling

var sEmailSubject = '';
var sEmailContent = ''; //try set this globally to reuse between intents
var sRecap = ''; //try set this globally to reuse between intents
var sTown = '';
var sEmailQuestion = '';
var FetchResult = '';


//saying factored out to enable wrapping in a repeat handler
const ask = (app, inputPrompt, noInputPrompts) => {
  app.data.lastPrompt = inputPrompt;
  app.data.lastNoInputPrompts = noInputPrompts;
  conv.ask(inputPrompt, noInputPrompts);
}

app.intent('Test', async (conv, params) => {  

//   // let sEmailAddress = 'pdscwork@gmail.com'  
// 	// let sEmailSubject = 'AOG email test';  
//   // let sEmailContent = 'Email sent from actions on google \r\n '; 
//   // sendEmail(sEmailAddress,sEmailSubject,sEmailContent);    
//   // //console.log('test output');
//   // conv.ask('Email sent');

// //let sHeaders = conv.headers.payload;
// //let myjson = JSON.parse(sHeaders);
// //console.log(myjson);

// console.log('pd debug');
// //let sHeaders = conv.headers.user-agent;
// //let myjson = JSON.parse(sHeaders);
// //console.log(myjson);

// console.log(conv.headers.host);



//debug chk execution time
var chkHrstart = process.hrtime()

// //console.log(conv.headers.User-Agent); //broke
// console.log('pd debug1');
// console.log(conv.headers);
// console.log('pd debug2');
// //console.log(conv.headers.user-agent);

let sPlatform = JSON.stringify(conv.surface.capabilities);
//console.log(sPlatform);
  
if ( sPlatform.indexOf('ACCOUNT_LINKING', 1) == -1){
  
  conv.ask('hi df');   
  conv.ask(new Suggestions('Yes', 'No'));

}
else{
  conv.ask('hi aog');  
  conv.ask(new Suggestions('Yes', 'No'));
}


//debug chk execution time
var chkhrend = process.hrtime(chkHrstart);
console.log('1 Execution time (hr): %ds %dms', chkhrend[0], chkhrend[1] / 1000000);

});


app.intent('Default Welcome Intent', async (conv) => {
  conv.ask('I can ask you a few questions to identify suitable local courses for you. Shall we start? ')
  conv.ask(new Suggestions('Yes', 'No'));
});


app.intent('Get Sign In', async (conv, params, signin) => {

  const email = conv.user.email //pdcode
  if (email == undefined ){
    //conv.ask("Sorry I don't have your email address")
     conv.ask(new SignIn("May I lookup your email address from your account profile?"));
  }
  else{
    conv.ask(`I got your email as ${email}. What do you want to do next?`)
  }
  
  //conv.ask('You can contact the National Careers Service for advise at https://nationalcareers.service.gov.uk/');

   
// //  conv.ask(`I got your email as ${email}. What do you want to do next?`) //pdcode
  
//   const color = conv.data[Fields.COLOR];
//   await conv.user.ref.set({[Fields.COLOR]: color});
//   conv.close(`I saved ${color} as your favorite color. ` +
//     `Since you are signed in, I'll remember it next time.`);
});


////currently handled within df not here
app.intent('humanRequest', async (conv, params) =>  {  
  conv.ask('You can contact the National Careers Service for advise at https://nationalcareers.service.gov.uk/');
})


app.intent('FindCourse', async (conv, params) =>  {
  
  //debug chk execution time
  var chkHrstart = process.hrtime()

  //var oParamStore = params;

  let sEmailQuestion = ". Would you like an email of the results?  ";

  
  //let result = await fetchData(params, 'courses');
  fetchData(params, 'courses');

  conv.ask('this takes a few moments, is that ok? ');  
  conv.ask(new Suggestions('Yes', 'No'));
  conv.contexts.set('context-fetchWaiting', 1);
  conv.contexts.delete('findcourse-followup');
  conv.contexts.delete('findcourse-followup2');  
  
 //debug chk execution time
 var chkhrend = process.hrtime(chkHrstart);
 console.log('1 Execution time (hr): %ds %dms', chkhrend[0], chkhrend[1] / 1000000);

})

app.intent('FindCourse-fetchWaiting', async (conv, params) =>  {
  
  console.log('FetchResult contents are:' + sEmailContent);
//conv.ask('fetch done');
//conv.ask(FetchResult);

  let sEmailQuestion = ". Would you like an email of the results?  ";  
  console.log(FetchResult);
if (FetchResult.indexOf("Sorry I didn't find") !== -1){ //string is found  
  conv.ask(FetchResult + ' Would like you like a list of the providers in that area? ');
  FetchResult = null; //trying to not exceed memory limit on firebase
  conv.ask(new Suggestions('Yes', 'No'));
  conv.contexts.set('context-NoCourses', 5);
  conv.contexts.delete('findcourse-followup');
  conv.contexts.delete('findcourse-followup2');  
  conv.contexts.delete('context-fetchWaiting');  
  } 
else{  
  conv.ask(FetchResult + sEmailQuestion);
  conv.ask(new Suggestions('Yes', 'No'));
  }
})

app.intent('FindCourse - GetProviders', async (conv, params) =>  {
  
  //debug chk execution time
  var chkHrstart = process.hrtime()

  let sEmailQuestion = ". Would you like an email of the results?  ";
  let result = await fetchData(params, 'providers');
  console.log(result);
  conv.ask(result + sEmailQuestion);
  conv.ask(new Suggestions('Yes', 'No'));
  result = null; //trying to not exceed memory limit on firebase
  conv.contexts.set('FindCourse-followup',2);
  conv.contexts.delete('context-NoCourses');
 //debug chk execution time
 var chkhrend = process.hrtime(chkHrstart);
 console.log('1 Execution time (hr): %ds %dms', chkhrend[0], chkhrend[1] / 1000000); 
})


app.intent('FindCourse-EmailTheResults', async (conv, params) =>  {

  const sEmail = conv.user.email //pdcode
  let sEmailAddress = sEmail;
  let sPlatform = JSON.stringify(conv.surface.capabilities);
  console.log(sPlatform);   

  if ( sPlatform.indexOf('ACCOUNT_LINKING', 1) != -1){    
    if (sEmail == undefined ){    
       conv.ask(new SignIn("May I lookup your email address from your account profile?"));       
       //conv.ask(new Suggestions('Yes', 'No'));
       conv.contexts.set('context-GotProfile', 5);
    }
    else{
      sendEmail(sEmailAddress,sEmailSubject,sEmailContent);      
      conv.close(`I got your email as ${sEmailAddress}. I'm sending the results now. Thanks for trying the service.`)
    }  
  }
  else{    
    conv.ask(". What is your email address? ");        
  }
})


app.intent('FindCourse-EmailTheResults - yes', async (conv, params) =>  {

  let sEmailAddress = params.EmailAddress
  //let sEmailAddress = 'pdscwork@gmail.com';
  //	let sEmailContent = 'test content';
  //ask(app, ' I\'m sending an email to ' + sEmailAddress + ' now. Do you want to search again?');
  //only try sending email of search results if asked to
  if (sEmailAddress != 'no email') {
    sendEmail(sEmailAddress,sEmailSubject,sEmailContent);      
  }
  conv.close('Sending the search results email now. Thanks for trying the service.')
})


app.intent('FindCourse-EmailTheResults -AskEmailAddress', async (conv, params) =>  {

  let sEmailAddress = params.pEmailAddress
  //let sEmailAddress = 'pdscwork@gmail.com';
  //	let sEmailContent = 'test content';
  //ask(app, ' I\'m sending an email to ' + sEmailAddress + ' now. Do you want to search again?');
  //only try sending email of search results if asked to
  if (sEmailAddress != 'no email') {
    sendEmail(sEmailAddress,sEmailSubject,sEmailContent);      
  }
  conv.close('Sending the search results email now. Hope you find it useful.')
})


app.intent('FindCourse-EmailTheResults - GotProfile', async (conv, params) =>  {

  console.log('FindCourse-EmailTheResults - GotProfile');
  const sEmail = conv.user.email //pdcode
  let sEmailAddress = sEmail;  
  console.log(sEmailAddress);
  sendEmail(sEmailAddress,sEmailSubject,sEmailContent);        
  conv.close('Sending the email now. Thanks for your time.')
})


//#endregion intent handling


//#region  pd helper functions

function fetchData(params, target) {

  console.log('fetch started');


  let sIndustry = params.Industry
  let sDeliveryLocation = params.DeliveryLocation
  let sClassTime = params.ClassTime
  let iQualificationLevel = params.QualificationLevel
  let sLearnerLocation = params.LearnerLocation
  let sEmailAddress = params.EmailAddress
  
  // // test values
  // sIndustry = 'various';
  // iQualificationLevel = 'various';  
  // sClassTime = 'evening';
  // sDeliveryLocation = 'various';
  // sEmailAddress = 'pdscwork@gmail.com';
  // sLearnerLocation = 'Leeds';

  //// reset content of email text to avoid diff searches appending to last
  sEmailSubject = 'Your Course Search Results.';
  sEmailContent = "By the way, don't reply to this email address as it's unmonitored. You can find more search options and support on the National Careers Service website. https://nationalcareers.service.gov.uk/find-a-course/search "; //try set this globally to reuse between intents
  sRecap = ''; //try set this globally to reuse between intents
  FetchResult ='';

  // //base reply on text from separate file
  //let sSay = strings.general.courseSummaryPrefix;
  let sSay = "";
  let sSayProviders = ""; // alt list of providers if no coures found
  sRecap = "";
  var sFilterString = "";
  let sCourseTitles = "";
  // let sEmailContent = '';

  if (target=='courses'){
    //build filter string from optional responses
    sRecap = "You requested: ";
    if (sIndustry != 'various') {    
      sRecap = sRecap + ' Industry: ' + sIndustry;
      sFilterString = sFilterString
        + " and ( "      
        + "    [Course SSA1] like '%" + sIndustry + "%'"
        + " or [Course SSA2] like '%" + sIndustry + "%'"
        + " or [Title] like '%" + sIndustry + "%'"
        + " or [Description] like '%" + sIndustry + "%'"
        + " ) ";
    }
    if (sDeliveryLocation != 'various') {
      if (sDeliveryLocation == 'Workplace') {
        sRecap = sRecap + ', delivered in the workplace ';
        sFilterString = sFilterString + " and [Delivered At] = 'Workplace' ";
      }
      else {
        sRecap = sRecap + ', delivered on campus ';
        sFilterString = sFilterString + " and [Delivered At] != 'Workplace' ";
      }
    }
    if (sClassTime != 'various') {
      sRecap = sRecap + ', attending: ' + sClassTime;
      sFilterString = sFilterString + " and MOA = '" + sClassTime + "'";
    }
    if (iQualificationLevel != 'various') {
      sRecap = sRecap + ', Study level: ' + iQualificationLevel;
      sFilterString = sFilterString + " and [Course Level] = " + iQualificationLevel + "";
    }

    if (sLearnerLocation != 'various') {
      sRecap = sRecap + ', Preferred location: ' + sLearnerLocation;
      sFilterString = sFilterString + " and [TOWN] = '" + sLearnerLocation + "'";   
      sTown =  sLearnerLocation; // store to get providers in a 2nd pass, and dont overwrite with undefined  
      // if(target =='courses'){
      //   sTown =  sLearnerLocation; // store to get providers in a 2nd pass, and dont overwrite with undefined  
      //   console.log('sTown is ' + sTown);
      //}    
    }
  }

  // if (sEmailAddress != 'noemail') {
  //   sRecap = sRecap + '. You requested an email of the results to: ' + sEmailAddress;
  // }
  

  sSay = sSay + sRecap;
  //ask(app, 'OK, ' + sSay); //debug

    var alasql = require('alasql');
    var sQuery = "";
    if (target == 'courses'){
      sQuery = "SELECT Title, ApplyLink, PROVIDER_NAME, [Course Level] as CourseLevel, Description, TOWN FROM CSV('WebCourseSearchExportFE.csv', {headers:true}) where 1 = 1 " + sFilterString;              
    }
    else{
      //sQuery = "SELECT distinct null as Title, ApplyLink, PROVIDER_NAME, null as CourseLevel, null as Description , Town FROM   CSV('WebCourseSearchExportFE.csv', {headers:true}) where [TOWN] like '%" + sLearnerLocation + "%'";
      sQuery = "SELECT distinct top 20 PROVIDER_NAME FROM CSV('WebCourseSearchExportFE.csv', {headers:true}) where [TOWN] = '" + sTown + "'";      
    }
    
    console.log(sQuery); //debug
   
    

    return new Promise(resolve => {       

      alasql.promise(sQuery)      
      .then(function (data) {  
        //resolve('resolved');

       
      for (let oCourse of data) {
        
        if (target == 'courses'){
          sCourseTitles = sCourseTitles + '. ' + oCourse.Title+ ' level '+ oCourse.CourseLevel  + ' with ' + oCourse.PROVIDER_NAME  ;          
        ////build formatted email body text with info on search and links to found courses
        sEmailContent = sEmailContent + '<br/>' + oCourse.Title + '<br/>' + oCourse.ApplyLink;
        }
        else
        {
          sCourseTitles = sCourseTitles + ', ' + oCourse.PROVIDER_NAME  ;
          sEmailContent = sEmailContent + '<br/>' + oCourse.PROVIDER_NAME;
        }
      }

      if (data.length == 0) {        
        sSay = sSay + ". Sorry I didn't find any "+ target +" match. ";
        //sEmailQuestion = ""; //// remove the offer to email results if there are none              
      } else
        if (data.length == 1) {
          sSay = sSay + ' I found ' + data.length + " " + target.replace("providers", " provider you could try, but no courses. ");
          sSay = sSay + ' ' + sCourseTitles;
        } else
          if (data.length > 1 && data.length < 7) {
            sSay = sSay + ' I found ' + data.length + " " + target.replace("providers", " providers you could try, but no courses. try  ");
            sSay = sSay + ' ' + sCourseTitles;
          } else
            if (data.length >= 7) {
              //// too many to list out
              sSay = sSay + ' I found ' + data.length + " " + target.replace("providers", " providers you could try, but no courses. ");
              //sEmailQuestion = sEmailQuestion + "I'll send you links to check out the courses we found. "
            } 

      if (target == 'courses'){
        console.log('pd: courses ' + sEmailContent);        
      }
      else{
        console.log('pd: providers ' + sEmailContent);        
      }
      sEmailContent = sSay + '<br/>' + sEmailContent;
      FetchResult = sSay ; //store this globally to fetch in followup intent
      functions.logger.log("FetchResult at end of fetch:", FetchResult);

        resolve(sSay );
        return null
      }
      ).catch(function (err) {
        console.log('Error: ', err);
        resolve( 'Had a bit of bother.');
      });
  });
  

}

const sendEmail =  function (sEmailAddress,sEmailSubject,sEmailContent) {      
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'pdscwork@gmail.com',        
        pass: 'dwddzveedshmtkng'
    }
  });

  const mailOptions = {
      from: 'NoReply <pdscwork@gmail.com>', 
      to: sEmailAddress,
      subject: sEmailSubject,
      html: sEmailContent
      // html: `<p style="font-size: 16px;">template header text here</p>
      //     <br />
      //     <img src="https://branding=image-here" />
      // ` // email content in HTML              
  };

  // returning result
  return transporter.sendMail(mailOptions, (erro, info) => {
      if(erro){
          return 'not sent';// res.send(erro.toString());
      }
      return 'sent'; //res.send('Sent');
  });
// });    
}

//#endregion  pd helper functions

