var population;
var lifespan = 400;
var lifeP;
var fitnessP;
var count = 0;
var target;
var maxforce = 0.2;
var generationP;
var generation = 1;

//Obstacle coordinates
var rx = 100;
var ry = 150;
var rw = 200;
var rh = 10;

//Setup the canvas, create the rockets and population
function setup() {
	createCanvas(400, 300)
	rocket = new Rocket();
	population = new Population();
	createP('Lifespan:');
	lifeP = createP();
	createP('Max fitness:')
	fitnessP = createP();
	createP('Generation:')
	generationP = createP();
	target = createVector(width/2, 50);
}

//Draw the canvas and run the population
function draw() {
	background(0);
	population.run();
	lifeP.html(count);
	generationP.html(generation);
	count++;

	//Create a new generation of rockets every 400 frames
	if(count == lifespan) {
		population.evaluate();
		population.selection();
		count = 0;
		generation++;
	}

	//Create the obstacle
	fill(255);
	noStroke();
	rect(rx, ry, rw, rh);

	//Create the target
	ellipse(target.x, target.y, 16, 16)
}

//Population object creates mating pool by evaluating and selecting
function Population() {
	this.rockets = [];
	this.popsize = 25;
	this.matingpool = [];

	//Creates the initial population
	for(var i = 0; i < this.popsize; i++) {
		this.rockets[i] = new Rocket();
	}
	
	//Evaluate the fitness of the rockets
	this.evaluate = function() {
		maxfit = 0;
		//For each rocket in the population size, calculate
		//their fitness, and update the max fitness
		for(var i = 0; i < this.popsize; i++) {
			this.rockets[i].calcFitness();
			if(this.rockets[i].fitness > maxfit) {
				maxfit = this.rockets[i].fitness;
			}
		}

		fitnessP.html(maxfit);

		//Normalize the fitnesses by dividing by maxfitness
		for(var i = 0; i < this.popsize; i++) {
			this.rockets[i].fitness /= maxfit;
		}
		//Clear the mating pool for next generation
		this.matingpool = [];

		//Take rockets normalized fitness, *100,
		//rocket with fitness value 100 should be in matingpool
		//100x, 3 in mating pool 3x etc.
		for(var i = 0; i < this.popsize; i++) {
			var n = this.rockets[i].fitness * 100;
			for(var j = 0; j < n; j++) {
				this.matingpool.push(this.rockets[i]);
			}
		}
	}

	//Selection function chooses parents from each side
	//of the matingpool and mutates them
	this.selection = function() {
		var newRockets = [];
		//pick 2 random parents from matingpool
		//and create a child from crossover of parents dna
		for(var i = 0; i < this.rockets.length; i++) {
			var parentA = random(this.matingpool).dna;
			var parentB = random(this.matingpool).dna;
			var child = parentA.crossover(parentB);
			child.mutation();
			newRockets[i] = new Rocket(child);
		}
		this.rockets = newRockets;
	}

	//For each rocket in the population, update and display them
	this.run = function() {
		for(var i = 0; i < this.popsize; i++) {
			this.rockets[i].update();
			this.rockets[i].show();
		}
	}
}

//DNA function creates the 'dna' of the paths, and assigns
//them to each rocket in the array
function DNA(genes) {
	if(genes) {
		this.genes = genes;
	} else {
		this.genes = [];
		//For each frame of each rocket, apply a random Vector
		for(var i = 0; i < lifespan; i++) {
			this.genes[i] = p5.Vector.random2D();
			this.genes[i].setMag(maxforce);
		}
	}	

	//Crossover function applies the genes of the parents
	//to the new generation
	this.crossover = function(partner) {
		var newgenes = [];
		//Merge genes from parents on two halves of a random
		//midpoint in the genepool
		var mid = floor(random(this.genes.length));
		for(var i = 0; i < this.genes.length; i++) {
			if(i > mid) {
				newgenes[i] = this.genes[i];
			} else {
				newgenes[i] = partner.genes[i];
			}
		}
		return new DNA(newgenes);
	}

	//Mutation function for creating minimal variation in dna
	this.mutation = function() {
		for(var i = 0; i < this.genes.length; i++) {
			if(random(1) < 0.01) {
				this.genes[i] = p5.Vector.random2D();
				this.genes[i].setMag(maxforce);
			}
		}
	}
}

//Rocket object takes dna and calculates fitness per rocket
function Rocket(dna) {
	//Spawn rocket at bottom middle of screen, 0 init velocity
	this.pos = createVector(width/2, height);
	this.vel = createVector();
	this.acc = createVector();
	this.speedcount = 0;
	this.completed = false;
	this.crashed = false;

	//If DNA is passed on to rocket, accept the DNA
	if(dna) {
		this.dna = dna;
	//Otherwise, create new random DNA
	} else {
		this.dna = new DNA();
	}

	this.applyForce = function(force) {
		this.acc.add(force);
	}

	//Fitness calculated based on rockets relative position
	//to target
	this.calcFitness = function() {
		var d = dist(this.pos.x, this.pos.y, target.x, target.y);
		this.fitness = map(d, 0, width, width, 0);

		//Give higher fitness to rockets that reach their target
		if(this.completed) {
			this.fitness *= 10;
		}
		//Give lower fitness to crashed rockets
		if(this.crashed) {
			this.fitness /= 10;
		}
	}

	//Check for collision and apply rocket's force
	this.update = function() {
		var d = dist(this.pos.x, this.pos.y, target.x, target.y);
		if(d < 10) {
			this.completed = true;
			this.pos = target.copy();
		}

		if(this.pos.x > rx && this.pos.x < rx + rw && this.pos.y > ry && this.pos.y < ry + rh) {
			this.crashed = true;
		}

		if(this.pos.x > width || this.pos.x < 0) {
			this.crashed = true;
		}
		if(this.pos.y > height + 5 || this.pos.y < 0) {
			this.crashed = true;
		}

		this.applyForce(this.dna.genes[count]);
		if(!this.completed && !this.crashed) {
			this.vel.add(this.acc);
			this.pos.add(this.vel);
			this.acc.mult(0);
			this.vel.limit(4);
		}

	}

	//Draw the rockets
	this.show = function() {
		push();
		noStroke();
		fill(255, 150);
		translate(this.pos.x, this.pos.y);
		rotate(this.vel.heading());
		rectMode(CENTER);
		rect(0, 0, 25, 5);
		fill('white');
		triangle(19, 0, 13, -3, 13, 3)
		fill('red');
		triangle(-22, 0, -12, -2, -12, 2)
		pop();
	}
}