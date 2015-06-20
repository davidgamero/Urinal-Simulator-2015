//config variables

var numberOfUrinals = 5;
var userPeriod = 2;//average minutes between visitors
var userPeriodSpread = 1;//how far the userPeriod deviates
var userTimeToPee = 4;//average time for each person to pee
var userTimeToPeeSpread = 2;

var showTimeToPeeRemaining = false;

var running = false; //whether we're running the live sim
var delayBetweenCycles = 100; //period of cycles in ms

//global tracking variables
var time;//time in minutes
var timeToNextVisitor;
var hadNewVisitor;

//array of people waiting in line
var lineOfPeople = new Array();

//array of the urinal objects
var urinals = new Array();


//getting all the first values and populating urinals
function init(){
    
    time = 0;//time in minutes
    timeToNextVisitor = getNextVisitorTime();//get time to first visitor
    hadNewVisitor = false;

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

//decide where the new visitor goes
function placeNewVisitor(){
    options = Array.apply(null, Array(numberOfUrinals)).map(function (_, i) {return i;});//range of possible urinal indexes
    newVisitorIndex = null;

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
    }
    

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

//move ahead by one minute
function advance(){

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
        placeNewVisitor();
    }

    time++;//add one minute to the time
    timeToNextVisitor--;

}


init();

for(var t = 100; t < 150; t++){
    advance();
    printShit(t,urinals);

}