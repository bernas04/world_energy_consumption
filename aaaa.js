// initial setup
var svg = d3.select("svg"),
	width = svg.attr("width"),
	height = svg.attr("height"),
	path = d3.geoPath(),
	data = d3.map(),
	worldmap = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson",
	worldpopulation = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world_population.csv",
	centered,
	world,
	result,
	iso_names = {};



function updateData() {

	console.log("updating data")
	console.log(all_data)

	// teste para alterar o domain
	// colorScale.domain([-20,-5,0,5,20])

	d3.queue()
		.defer(d3.json, worldmap)
		.defer(d3.json, '../js/data.json')
		.await(ready);

}


// style of geographic projection and scaling
const projection = d3.geoRobinson()
	.scale(130)
	.translate([width / 2, height / 2]);

// Define color scale
const colorScale = d3.scaleThreshold()
	.domain([100000, 1000000, 10000000, 30000000, 100000000, 500000000])
	.range(d3.schemeOrRd[7]);

// add tooltip
const tooltip = d3.select("body").append("div")
	.attr("class", "tooltip")
	.style("opacity", 0);

// Add clickable background
svg.append("rect")
  .attr("class", "background")
	.attr("width", width)
	.attr("height", height)
	.on("click", click);


// ----------------------------
//Start of Choropleth drawing
// ----------------------------

function ready(error, topo) {
	// topo is the data received from the d3.queue function (the world.geojson)
	// the data from world_population.csv (country code and country population) is saved in data variable

	if (error) throw error;


	// Remove previous svgs
	svg.selectAll("*").remove();

	// Callback functions to update data (d3.map())

	const current_year = document.getElementById("myRange").value;	
	document.getElementById("slide-value").innerText = current_year;
	var attribute;
	if (isEnergy == true) {
	    const source = document.getElementById("source").value;
	    const metric = document.getElementById("metric").value;
	    attribute = source + metric;
	} else {
	    attribute = document.getElementById("all_metric").value;
	}

	for (const [iso_code, years] of Object.entries(all_data)) {
		if (years[current_year] != undefined) data.set(iso_code, +years[current_year][attribute])
	}

	console.log(topo.features)

	let mouseOver = function(d) {
		d3.selectAll(".Country")
			.transition()
			.duration(200)
			.style("opacity", .5)
			.style("stroke", "transparent");
		d3.select(this)
			.transition()
			.duration(200)
			.style("opacity", 1)
			.style("stroke", "black");
		tooltip.style("left", (d3.event.pageX + 15) + "px")
			.style("top", (d3.event.pageY - 28) + "px")
			.transition().duration(400)
			.style("opacity", 1)
			.text(d.properties.name + ': ' + Math.round(d.total));
	}

	let mouseLeave = function() {
		d3.selectAll(".Country")
			.transition()
			.duration(200)
			.style("opacity", 1)
			.style("stroke", "transparent");
		tooltip.transition().duration(300)
			.style("opacity", 0);
	}

	// Draw the map
	world = svg.append("g")
	.attr("class", "world");
	world.selectAll("path")
		.data(topo.features)
		.enter()
		.append("path")
		// draw each country
		// d3.geoPath() is a built-in function of d3 v4 and takes care of showing the map from a properly formatted geojson file, if necessary filtering it through a predefined geographic projection
		.attr("d", d3.geoPath().projection(projection))

		//retrieve the name of the country from data
		.attr("data-name", function(d) {
			return d.properties.name
		})

		// set the color of each country
		.attr("fill", function(d) {
			d.total = data.get(d.id) || 0;
			return colorScale(d.total);
		})

		// add a class, styling and mouseover/mouseleave and click functions
		.style("stroke", "transparent")
		.attr("class", function(d) {
			return "Country"
		})
		.attr("id", function(d) {
			return d.id
		})
		.style("opacity", 1)
		.on("mouseover", mouseOver)
		.on("mouseleave", mouseLeave)
		.on("click", click);



	// Legend
	const x = d3.scaleLinear()
		.domain([2.6, 75.1])
		.rangeRound([600, 860]);

	const legend = svg.append("g")
		.attr("id", "legend");

	const legend_entry = legend.selectAll("g.legend")
		.data(colorScale.range().map(function(d) {
			d = colorScale.invertExtent(d);
			if (d[0] == null) d[0] = x.domain()[0];
			if (d[1] == null) d[1] = x.domain()[1];
			console.log(d)
			return d;
		}))
		.enter().append("g")
		.attr("class", "legend_entry");

	const ls_w = 20,
		ls_h = 20;

	legend_entry.append("rect")
		.attr("x", 20)
		.attr("y", function(d, i) {
			return height - (i * ls_h) - 2 * ls_h;
		})                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
		.attr("width", ls_w)
		.attr("height", ls_h)
		.style("fill", function(d) {
			return colorScale(d[0]);
		})
		.style("opacity", 0.8);

	legend_entry.append("text")
		.style("fill","#000000")
		.attr("x", 50)
		.attr("y", function(d, i) {
			return height - (i * ls_h) - ls_h - 6;
		})
		.text(function(d, i) {
			console.log(d)
			if (i === 0) return "< " + d[1];
			if (d[1] < d[0]) return d[0] + "+";
			return d[0] + " - " + d[1];
		});

	legend.append("text").style("fill","#000000").attr("x"	, 15).attr("y", 280).text("Population (Million)");

}

// Zoom functionality
function click(d) {
  var x, y, k;

  if (d && centered !== d) {
    var centroid = path.centroid(d);
    x = -(centroid[0] * 6);
    y = (centroid[1] * 6);
    k = 3;
    centered = d;
  } else {
    x = 0;
    y = 0;
    k = 1;
    centered = null;
  }

  world.selectAll("path")
      .classed("active", centered && function(d) { return d === centered; });

  world.transition()
      .duration(750)
      .attr("transform", "translate(" + x + "," + y + ") scale(" + k + ")" );
}









// ==================== code ========================== //

isEnergy = false;

// all data / energy source (radio button change event)
function energySelect(boolean) {
    isEnergy = boolean;
	if (boolean == true) {
		document.getElementById("source").disabled = false;
		document.getElementById("all_metric").hidden = true;
		document.getElementById("metric").hidden = false;
	} else {
		document.getElementById("source").disabled = true;
		document.getElementById("all_metric").hidden = false;
		document.getElementById("metric").hidden = true;
	}
	updateData();
}


function loadAndProcessData(file) {

    const request = new XMLHttpRequest();
	request.open('GET', file, false);  // `false` makes the request synchronous
	request.send(null);

	if (request.status === 200) {
		var responseText = request.responseText
		all_data = JSON.parse(responseText);

		proccessed_data = {}
		all_data.forEach(country => {

			// Store country data by year (key) and attributes (value)
			const country_data = Object.fromEntries(
				Object.values(country)[0].map(e => [e.year, e])
			)

			// Get country iso_code by selecting random object and pick attribute:
			const keys = Object.keys(country_data);
			const key = keys[Math.floor(Math.random() * keys.length)];
			const iso_code = country_data[key].iso_code;
			if (iso_code != undefined) proccessed_data[iso_code] = country_data;
			
		});
		return proccessed_data;
	}
	return undefined;
}

var all_data = loadAndProcessData("../js/data.json");
updateData();

// Update iso_names

for (const iso of Object.keys(all_data)) {
	const years = Object.keys(all_data[iso]);
	const year = years[Math.floor(Math.random() * years.length)];
	const name = all_data[iso][year]['country'];
	iso_names[iso] = name;
}