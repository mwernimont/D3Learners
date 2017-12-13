// function to combine EPL json data
// json data from https://github.com/jokecamp/FootballData/tree/master/EPL%201992%20-%202015/tables
// years 1992 to 2015

function load_data() {

	var seasons = ["92-93","93-94","94-95","95-96","96-97","97-98",
			   "98-99","99-00","00-01","01-02","02-03","03-04",
			   "04-05","05-06","06-07","07-08","08-09","09-10",
			   "10-11","11-12","12-13","13-14","14-15"];
	//"https://raw.githubusercontent.com/jokecamp/FootballData/master/EPL%201992%20-%202015/tables/epl-92-93.json"
	var baseurl = "https://raw.githubusercontent.com/jokecamp/FootballData/master/EPL%201992%20-%202015/tables/epl";
	//console.log(seasons);
	var q = d3.queue();
	seasons.forEach(function(s) {
		url = baseurl + "-" + s + ".json";
		q.defer(parseEPLJson, url, s);
	});

	return q.await(combineData);
	
}

// custom function to read json files and add the seasons to the json data
function parseEPLJson(url, season, callback) {
	d3.json(url, function(data) {
		data.forEach(function(d) {
			d.season = season;
			d["goals-dff"] = parseFloat(d["goals-dff"]); //parseFloat for handling negative values
			// keep only the first season and convert to year
				var yr1 = season.match(/[0-9]{2}-*/)[0];
				d.startyear = d3.timeParse("%y")(yr1.replace("-","")).getFullYear();
		});
		callback(null, data); // CALLBACK MUST BE INSIDE d3.json --- VERY IMPORTANT. This is what tells d3.defer what to return when it is ready
	});
}

// function to ultimately use all the queued up json files
function combineData(error, seasons) {
	// arguments is used to account for all objects, especially useful for unknown number of objects
	// From learnjsdata.com/read_data.html: "The callback function passed into await gets each dataset 
	// as a parameter, with the first parameter being populated if an error has occurred in loading the data."

	// arguments[0] is the error
	error = arguments[0];
	
	// the rest of the indices of arguments are all the other arguments passed in
	// so in this case, all of the results from q.defers
	var allJsonArrays = Array.prototype.slice.call(arguments); // convert arguments to a normal array
	allJsonArrays.splice(0,1); // chop off the error part of arguments so you are left w. just the q.defer results
	allJsonArrays.forEach(function(d, i) {
		var current_season = seasons[i];
	})

	var merged_data = d3.merge(allJsonArrays);

	merged_data.sort(function(a, b) { 
		return d3.ascending(a.startyear, b.startyear); 
	});
	
	// this is where you put code to use merged_data!!!!!!!!!!!!!!!!!!!!!!
	var yvar = document.getElementById("yaxis").value.toLowerCase();
	plotarea = addDataToPlot(plotarea, merged_data, yvar);
	plotarea = update(plotarea);
	plotarea = exit(plotarea);

	d3.select("form").on("submit", function(d) {
        var new_yvar = document.getElementById("yaxis").value.toLowerCase();
        if(new_yvar == "goal differential") {
        	new_yvar = "goals-dff";
        }
        console.log(new_yvar);

        plotarea = addDataToPlot(plotarea, merged_data, new_yvar);
        plotarea = exit(plotarea);

        //by default html form submissions does a full page refresh, this turns that off
        d3.event.preventDefault(); 
    });

	return plotarea;
}

function addDataToPlot(plot, data, yvar) {
	
	// add to scaling functions based on data
	var ymax = d3.max(data, function(d) { return d[yvar]; })
		uniqueyears = d3.map(data, function(d){ return d.startyear; }).keys()
		uniqueteams = d3.map(data, function(d){ return d.team; }).keys();
	xScale.domain(uniqueyears); 
	yScale.domain([ymax, 0]);
	colorScale.domain(uniqueteams);

	// add axes
	axesDetails.append("g")
          .attr("id", "xAxis")
          .attr("transform", "translate(" + 0 + "," + plotheight + ")")
          .classed("axis", true)
          .call(xAxis);
    axesDetails.append("g")
          .attr("id", "yAxis")
          .classed("axis", true)
          .call(yAxis);

	// setup line function
	var buildLine = d3.line().curve(d3.curveCardinal)
		.x(function(d) { return xScale(d.startyear); })
		.y(function(d) { return yScale(d[yvar]); });

	// organize data by team
	var databyteam = d3.nest()
    	.key(function(d) { return d.team; })
    	.entries(data);
    
	// add points
	var pts_g = plot.append("g").attr("class", "datapt");
	pts_g.selectAll(".datapt")
		.data(data).enter()
		.append("circle")
		.attr("class", "datapt")
		.attr("r", 3)
		.attr("cx", function(d) { return xScale(d.startyear); })
		.attr("cy", function(d) { return yScale(d[yvar]); })
		.style("fill", function(d) { return colorScale(d.team); });
		
	// add lines
	var lines_g = plot.append("g").attr("class", "teamline")	
	databyteam.forEach(function(d, i) {
		lines_g.append("path")
		.attr("class", "teamline")
		.attr("d", buildLine(d.values))
		.style("stroke", colorScale(d.key))
		.style("fill", "none");
	})

	// update phase????
	lines_g.selectAll(".teamline")
		.on("mouseover", function(d) {
			var this_color = d3.select(this).style("stroke");
			d3.selectAll(".teamline").style("stroke", "grey");
			d3.select(this).style("stroke", this_color);
			d3.select(this).style("stroke-width", 5);
		})
		.on("mouseout", function(d) {
			d3.selectAll(".teamline").style("stroke", colorScale(d.key));
			d3.select(this).style("stroke-width", 1);
		})


	// exit phase not working?
	plot.exit().remove();

	//console.log(databyteam);
	return plot;
}

function update(plot) {


	return plot;
}

function exit(plot) {
	
	return plot;
}
