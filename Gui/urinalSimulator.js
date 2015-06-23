//config variables

var numberOfUrinals = 10;
var userPeriod = 0;//average minutes between visitors
var userPeriodSpread = 2;//how far the userPeriod deviates
var userTimeToPee = 7;//average time for each person to pee
var userTimeToPeeSpread = 2;

var showTimeToPeeRemaining = false;

//sound related config
var soundEnabled = true; //preference for using sounds
var maxFrequency = 880; //A5 is the max
var minFrequency = 220; //A3 is the min
var synthSound = "sin"; //type of synth sound
var soundDuration = 1000; //time each sound plays in ms

var lastNumberOfUrinals; //tracking for invalid numbers of urinals

var running = false; //whether we're running the live sim

var delayBetweenCycles = 100; //period of cycles in ms
var minNumberOfUrinals = 3; //no complexity with less than 3

//HTML vars
var unoccupiedUrinalBGColor = "lightgrey";
var occupiedUrinalBGColor = "grey";
var occupiedUrinalUsesTextColor = "white";
var unoccupiedUrinalUsesTextColor = "black";

//global tracking variables
var time;//time in minutes
var timeToNextVisitor;
var hadNewVisitor;
var timeSinceLastCycle = 0;

//array of people waiting in line
var lineOfPeople = new Array();

//array of the urinal objects
var urinals;


//getting all the first values and populating urinals
function init(){

    time = 0;//time in minutes
    timeToNextVisitor = getNextVisitorTime();//get time to first visitor
    hadNewVisitor = false;

    //initialize empty urinals array
    urinals = null;
    urinals = new Array();

    //initially populate the array of urinal objects
    for(i = 0;i < numberOfUrinals;i++){
        urinals.push({occupied:false,uses:0,visitor:null});
    }
}

//get time to next visitor
function getNextVisitorTime(){
    var adjusteduserPeriod = userPeriod - userPeriodSpread + (Math.random() * userPeriodSpread * 2);
    return Math.round(adjusteduserPeriod);
}

//runs when we had a new visitor
function newVisitor(){
    hadNewVisitor = true;
    timeToNextVisitor = getNextVisitorTime();//get next adjusted time to visitor
    var newVisitorTimeToPee = Math.round(userTimeToPee - userTimeToPeeSpread + (Math.random() * userTimeToPeeSpread * 2));

    lineOfPeople.push({timeToPee:newVisitorTimeToPee,timeToPeeRemaining:newVisitorTimeToPee});

}

//count how many neighbors adjacent to a specific urinal
function countNeighbors(index){
    if(index < 0 || index > urinals.length - 1){
        console.log("Invalid index in countNeighbors()");
        return;
    }
    var neighbors = 0;//how many neighbors

    switch(index){
    case 0:
    	//first urinal only counts one to the right
    	if(urinals[1].occupied){
    		neighbors += 1;
    	}
        break;
    case urinals.length - 1:
        //last urinal only counts one to the left
        if(urinals[urinals.length - 2].occupied){
            neighbors += 1;
        }
        break;
    default:
    	//get left or right occupied neighbors for each urinal that isnt on an end
		if(urinals[index - 1].occupied){
			neighbors += 1;
		}
		if(urinals[index + 1].occupied){
			neighbors += 1;
		}
        break;
    }
    //spit back the number of neighbors
    return neighbors;

}

//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/max
function getMaxOfArray(numArray) {
    return Math.max.apply(null, numArray);
}

//make an array of every number up to max
function increaasingArray(max){
    arr = new Array();
    for(var i = 0; i < max; i++){
        arr.push(i);
    }
    return arr;
}

//delay function
function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
            break;
        }else if(document.getElementById("goBtn").value = "false"){
            break;
        }
    }
}

//play a sound for the new visitor
function playVisitorSound(newVisitorIndex, numberOfUrinals){

    //scale the urinal number to the frequency range
    var soundFrequency = minFrequency + (maxFrequency - minFrequency) * (newVisitorIndex / (numberOfUrinals - 1));

    //define the timbre sound object
    var sound1 = T(synthSound, {freq:soundFrequency, mul:1.0});

    //play the timbre sound
    T("perc", {r:soundDuration}, sound1).on("ended", function() {
      this.pause();
    }).bang().play();
}

//decide where the new visitor goes
function placeNextVisitor(){
    options = null;
    options = increaasingArray(numberOfUrinals);//range of possible urinal indexes
    newVisitorIndex = null;

    var optionsString = "";
    for(var i = 0;i < options.length;i++){
        optionsString += options[i].toString();
    }

    //remove currently occupied urinals
    for(i = options.length - 1; i >= 0; i--){
        if(urinals[options[i]].occupied){
            options.splice(i,1); //remove the index because that urinal is busy
        }
    }

    //check if there are any free
    if(options.length == 0){
        //all urinals full, exit
        console.log('MAX CAPACITY REACHED');
        return;
    }

    //get minimum neighbors
    var minNeighbors = countNeighbors(options[0]);

    for(i = 0;i < options.length;i++){
        if(countNeighbors(options[i]) < minNeighbors){
            minNeighbors = countNeighbors(options[i]);
        }
    }

    //keep only the highest privacy urinals that are also free
    for(i = options.length - 1;i >= 0; i--){
        if(countNeighbors(options[i]) > minNeighbors){
            options.splice(i,1);
        }
    }

    //take first then last urinal if open and has least neighbors
    if(options.indexOf(0) != -1){
        newVisitorIndex = 0;
    }else if(options.indexOf(urinals.length - 1) != -1){
        newVisitorIndex = urinals.length - 1;
    }else{
        //use the lowest index one (closest to the door)
        newVisitorIndex = options[0];
    }

    //if theres a spot to put the new visitor in, place them
    if(newVisitorIndex != null){
        //Put first person from line into the optimal urinal
        urinals[newVisitorIndex].visitor = lineOfPeople.pop();
        urinals[newVisitorIndex].occupied = true;
        urinals[newVisitorIndex].uses++;

        //play the sound for the new visitor index if sound is enabled
        if(soundEnabled){
            playVisitorSound(newVisitorIndex, numberOfUrinals);
        }
    }


}

//toggle sound enabled
function toggleSound(){
    soundEnabled = !soundEnabled;
}

//set the new wave type for the sounds based on which element in the dropdown was clicked
function waveTypeDropdownClicked(){
    synthSound = this.id;
}

//console log the current state
function printShit(time, urinals){
    outputSting = time.toString() + ' Line: ' + lineOfPeople.length + ' |';

    for(i = 0;i < urinals.length;i++){
        //space from separator
        outputSting += ' ';

        //add occupied state
        if(urinals[i].occupied){
            //occupied
            outputSting += 'X';
        }else{
            //empty
            outputSting += ' ';
        }

        if(showTimeToPeeRemaining){
            if(urinals[i].visitor != null){
                outputSting += urinals[i].visitor.timeToPeeRemaining;
            }else{
                //empty
                outputSting += ' ';
            }
        }

        //separator
        outputSting += ' |'

    }

    console.log(outputSting);

}

//attach listeners and prepare HTML
function initHTMLControls(){
    document.getElementById("stopBtn").addEventListener("click",halt);
    document.getElementById("stepBtn").addEventListener("click",step);
    document.getElementById("goBtn").addEventListener("click",go);

    document.getElementById("delayBetweenCycles").value = 1000 / delayBetweenCycles;
    document.getElementById("userPeriod").value = userPeriod;
    document.getElementById("userPeriodSpread").value = userPeriodSpread;
    document.getElementById("userTimeToPee").value = userTimeToPee;
    document.getElementById("userTimeToPeeSpread").value = userTimeToPeeSpread;

    document.getElementById("numberOfUrinals").value = numberOfUrinals;

    //attch listeners to all the sound <li> options in the wave type <ul> element
    for(var i = 0; i < document.getElementById("waveTypeDropdown").children.length; i++){
        document.getElementById("waveTypeDropdown").children[i].addEventListener("click",waveTypeDropdownClicked);
    }

    document.getElementById("toggleSoundBtn").addEventListener("click",toggleSound);
}


//update controls display
function updateHTMLControls(){

    //change "Go" text
    if(document.getElementById("goBtn").value == "true"){
        //we're running
        document.getElementById("goBtn").innerHTML = "...";
    }else{
        document.getElementById("goBtn").innerHTML = "Go";
    }

    //change turn sound ON or OFF text
    if(!soundEnabled){
        //sound is off
        document.getElementById("toggleSoundBtn").innerHTML = "Turn sound on";
    }else{
        document.getElementById("toggleSoundBtn").innerHTML = "Turn sound off"
    }

}

//get values from HTML elements to update the params
function getHTMLParams(){
    delayBetweenCycles = 1000 / document.getElementById("delayBetweenCycles").value;

    userPeriod = document.getElementById("userPeriod").value;
    userPeriodSpread = document.getElementById("userPeriodSpread").value;
    userTimeToPee = document.getElementById("userTimeToPee").value;
    userTimeToPeeSpread = document.getElementById("userTimeToPeeSpread").value;

    lastNumberOfUrinals = numberOfUrinals; //store last number of urinals

    //update number of urinals from HTML elements
    if(document.getElementById("numberOfUrinals").value != numberOfUrinals){
        if(document.getElementById("numberOfUrinals").value < minNumberOfUrinals){
            numberOfUrinals = minNumberOfUrinals;
        }else{
            numberOfUrinals = document.getElementById("numberOfUrinals").value;
        }

    }

    //number of urinals has changed, reset the simulation to avoid breaking everything
    if(numberOfUrinals != lastNumberOfUrinals){
        restartSim();
    }
}

//init the bathroom graphic
function initHTMLBathroom(){
    var bathroomBox = document.getElementById("bathroomBox");

    //clear the bathroomBox graphic area
    while (bathroomBox.firstChild) {
        bathroomBox.removeChild(bathroomBox.firstChild);
    }

    //add each urinalBox to the bathroomBox
    for(var i = 0; i < urinals.length; i++){
        var urinalBox = document.createElement("DIV");
        //id of the new urinalBox to be created
        urinalBoxId = "urinalBox" + i.toString();
        urinalBox.id = urinalBoxId;

        urinalBox.className = "urinalBox";
        urinalBox.style.width = 100/numberOfUrinals + "%";
        urinalBox.style.height = "50%";


        var timeToPeeRemainingBox = document.createElement("DIV");
        timeToPeeRemainingBox.className = "timeToPeeRemainingBox";
        timeToPeeRemainingBox.id = "timeToPeeRemainingBox" + i.toString();
        timeToPeeRemainingBox.innerHTML = i.toString();
        urinalBox.appendChild(timeToPeeRemainingBox);

        var urinalGraphicBox = document.createElement("DIV");
        urinalGraphicBox.className = "urinalGraphicBox";
        urinalGraphicBox.id = "urinalGraphicBox" + i.toString();
        urinalGraphicBox.style.backgroundColor = unoccupiedUrinalBGColor;
        urinalGraphicBox.innerHTML = "<br><br><br><br><br><br><div class=\"urinalUsesBox\" id=\"urinalUsesBox" + i.toString() + "\"></div><br><br><br><br><br><br>";
        urinalBox.appendChild(urinalGraphicBox);


        bathroomBox.appendChild(urinalBox);

    }
}

//show the bathroom
function updateHTMLBathroom(){
    //update each urinal
    for(var i = 0; i < urinals.length; i++){
        //id of the new urinalBox to be updated
        urinalBox = document.getElementById("urinalBox" + i.toString());
        urinalGraphicBox = document.getElementById("urinalGraphicBox" + i.toString());
        timeToPeeRemainingBox = document.getElementById("timeToPeeRemainingBox" + i.toString());
        urinalUsesBox = document.getElementById("urinalUsesBox" + i.toString());

        //update the urinalUsesBox
        urinalUsesBox.innerHTML = urinals[i].uses;

        //set the bg color by occupied status
        if(urinals[i].occupied){
            //yes occupied
            urinalGraphicBox.style.backgroundColor = occupiedUrinalBGColor; //set occupied color

            //update the time to pee displayed
            timeToPeeRemainingBox.innerHTML = urinals[i].visitor.timeToPeeRemaining;

            //update urinalUsesBox text color
            urinalUsesBox.style.color = occupiedUrinalUsesTextColor;

        }else{

            urinalGraphicBox.style.backgroundColor = unoccupiedUrinalBGColor;

            timeToPeeRemainingBox.innerHTML = "_";

            //update urinalUsesBox text color
            urinalUsesBox.style.color = unoccupiedUrinalUsesTextColor;
        }
    }

    //update line display
    var lineText;
    switch(lineOfPeople.length){
        case 0:
            lineText = "There ain't a line";
            break;
        case 1:
            lineText = "There's 1 person in line";
            break;
        default:
            lineText = "There are " + lineOfPeople.length +" people in line";
            break;
    }

    document.getElementById("lineBox").innerHTML = lineText;
}

//move ahead by one minute
function advance(){
    //update the params before running this cycle
    getHTMLParams();

    //iterate over the urinals
    for(i = 0;i < numberOfUrinals;i++){
        if(urinals[i].visitor != null){
            urinals[i].visitor.timeToPeeRemaining--;

            if(urinals[i].visitor.timeToPeeRemaining < 1){
                urinals[i].occupied = false;
                urinals[i].visitor = null;
            }
        }

    }

    //reset new visitor boolean
    hadNewVisitor = false;
    if(timeToNextVisitor < 0){
        //a visitor has arrived
        newVisitor();
    }

    //place the next guy in line
    if(lineOfPeople.length > 0){
        placeNextVisitor();
    }

    time++;//add one minute to the time
    timeToNextVisitor--;

    //update the graphics to reflect changes
    updateHTMLBathroom();
}

//stop button clicked
function halt(){
    running = false;
    document.getElementById("goBtn").value = "false";
}

//step button clicked
function step(){
    getHTMLParams();
    advance();
}

//go button clicked
function go(){
    running = true
    document.getElementById("goBtn").value = "true";


}
//one call to update everything after a cycle delay
function cycle(){

    if(document.getElementById("goBtn").value == "true" && timeSinceLastCycle > delayBetweenCycles){
        timeSinceLastCycle = 0;
        step();
    }else {
        timeSinceLastCycle += 10;
        getHTMLParams();
    }

    updateHTMLControls();

}

//restart the simulation
function restartSim(){
    init();
    initHTMLBathroom();

}



window.onload = function () {
    init();
    initHTMLControls();
    initHTMLBathroom();




    //run a new cycle every ten milliseconds
    window.setInterval(cycle,10);
}
