function mapDisplay() {
  // initial setup
  var svg = d3.select("svg"),
    width = svg.attr("width"),
    height = svg.attr("height"),
    path = d3.geoPath(),
    data = d3.map(),
    worldmap =
      "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson",
    worldpopulation =
      "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world_population.csv",
    centered,
    world;

  // style of geographic projection and scaling
  const projection = d3
    .geoRobinson()
    .scale(130)
    .translate([width / 2, height / 2]);

  // Define color scale
  const colorScale = d3
    .scaleThreshold()
    .domain([100000, 1000000, 10000000, 30000000, 100000000, 500000000])
    .range(d3.schemeOrRd[7]);

  // add tooltip
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // Load external data and boot

  d3.queue()
    .defer(d3.json, worldmap)
    .defer(d3.csv, worldpopulation, function (d) {
      data.set(d.code, +d.pop);
    })
    .await(ready);

  // Add clickable background
  svg
    .append("rect")
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

    let mouseOver = function (d) {
      d3.selectAll(".Country")
        .transition()
        .duration(200)
        .style("opacity", 0.5)
        .style("stroke", "transparent");
      d3.select(this)
        .transition()
        .duration(200)
        .style("opacity", 1)
        .style("stroke", "black");
      tooltip
        .style("left", d3.event.pageX + 15 + "px")
        .style("top", d3.event.pageY - 28 + "px")
        .transition()
        .duration(400)
        .style("opacity", 1)
        .text(
          d.properties.name +
            ": " +
            Math.round((d.total / 1000000) * 10) / 10 +
            " millions"
        );
    };

    let mouseLeave = function () {
      d3.selectAll(".Country")
        .transition()
        .duration(200)
        .style("opacity", 1)
        .style("stroke", "transparent");
      tooltip.transition().duration(300).style("opacity", 0);
    };

    // Draw the map
    world = svg.append("g").attr("class", "world");
    world
      .selectAll("path")
      .data(topo.features)
      .enter()
      .append("path")
      // draw each country
      // d3.geoPath() is a built-in function of d3 v4 and takes care of showing the map from a properly formatted geojson file, if necessary filtering it through a predefined geographic projection
      .attr("d", d3.geoPath().projection(projection))

      //retrieve the name of the country from data
      .attr("data-name", function (d) {
        return d.properties.name;
      })

      // set the color of each country
      .attr("fill", function (d) {
        d.total = data.get(d.id) || 0;
        return colorScale(d.total);
      })

      // add a class, styling and mouseover/mouseleave and click functions
      .style("stroke", "transparent")
      .attr("class", function (d) {
        return "Country";
      })
      .attr("id", function (d) {
        return d.id;
      })
      .style("opacity", 1)
      .on("mouseover", mouseOver)
      .on("mouseleave", mouseLeave)
      .on("click", click);

    // Legend
    const x = d3.scaleLinear().domain([2.6, 75.1]).rangeRound([600, 860]);

    const legend = svg.append("g").attr("id", "legend");

    const legend_entry = legend
      .selectAll("g.legend")
      .data(
        colorScale.range().map(function (d) {
          d = colorScale.invertExtent(d);
          if (d[0] == null) d[0] = x.domain()[0];
          if (d[1] == null) d[1] = x.domain()[1];
          return d;
        })
      )
      .enter()
      .append("g")
      .attr("class", "legend_entry");

    const ls_w = 20,
      ls_h = 20;

    legend_entry
      .append("rect")
      .attr("x", 20)
      .attr("y", function (d, i) {
        return height - i * ls_h - 2 * ls_h;
      })
      .attr("width", ls_w)
      .attr("height", ls_h)
      .style("fill", function (d) {
        return colorScale(d[0]);
      })
      .style("opacity", 0.8);

    legend_entry
      .append("text")
      .style("fill", "#000000")
      .attr("x", 50)
      .attr("y", function (d, i) {
        return height - i * ls_h - ls_h - 6;
      })
      .text(function (d, i) {
        if (i === 0) return "< " + d[1] / 1000000 + " M";
        if (d[1] < d[0]) return d[0] / 1000000 + " M +";
        return d[0] / 1000000 + " M - " + d[1] / 1000000 + " M";
      });

    legend
      .append("text")
      .style("fill", "#000000")
      .attr("x", 15)
      .attr("y", 280)
      .text("Population (Million)");
  }

  // Zoom functionality
  function click(d) {
    var x, y, k;

    if (d && centered !== d) {
      var centroid = path.centroid(d);
      x = -(centroid[0] * 6);
      y = centroid[1] * 6;
      k = 3;
      centered = d;
    } else {
      x = 0;
      y = 0;
      k = 1;
      centered = null;
    }

    world.selectAll("path").classed(
      "active",
      centered &&
        function (d) {
          return d === centered;
        }
    );

    world
      .transition()
      .duration(750)
      .attr("transform", "translate(" + x + "," + y + ") scale(" + k + ")");
  }
}

/* ================================= scatter plot ========================================= */

function drawScatterPlot() {
  keepOneGraph();
  let iso_country = getSelectedOptions();
  let currentValues;


  let countrYearValues = {};
  for (const [countryCode, country] of Object.entries(iso_country)) {
    currentValues = getDataGraph(countryCode);
    countrYearValues[country] = currentValues;
  }

  let maxY = 0,
    minY = 0;

  // Add Y axis
  for (let [country, yearValues] of Object.entries(countrYearValues)) {
    for (let [year, value] of Object.entries(yearValues)) {
      if (maxY < value.value) {
        maxY = value.value;
      }

      if (minY > value.value) {
        minY = value.value;
      }
    }
  }


  var margin_second_graph = { top: 45, right: 45, bottom: 90, left: 90 },
    width = 690 - margin_second_graph.left - margin_second_graph.right,
    height = 600 - margin_second_graph.top - margin_second_graph.bottom;

  // append the svg object to the body of the page
  var svg_second_graph = d3
    .select("#scatter_plot")
    .append("svg")
    .attr("width", width + margin_second_graph.left + margin_second_graph.right)
    .attr(
      "height",
      height + margin_second_graph.top + margin_second_graph.bottom
    )
    .append("g")
    .attr(
      "transform",
      "translate(" +
        margin_second_graph.left +
        "," +
        margin_second_graph.top +
        ")"
    );

  //Read the data

  const colors = [
    "#e6194b",
    "#3cb44b",
    "#ffe119",
    "#4363d8",
    "#f58231",
    "#911eb4",
    "#46f0f0",
    "#f032e6",
    "#bcf60c",
    "#fabebe",
    "#008080",
    "#e6beff",
    "#9a6324",
    "#fffac8",
    "#800000",
    "#aaffc3",
    "#808000",
    "#ffd8b1",
    "#000075",
    "#808080",
    "#ffffff",
    "#000000",
  ];

  let one_option = Object.keys(countrYearValues)[0];
  // Add X axis
  var x = d3
    .scaleLinear()
    .domain([
		countrYearValues[one_option][0].year,
		countrYearValues[one_option][countrYearValues[one_option].length - 1].year,
    ])
    .range([0, width]);

  svg_second_graph
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickFormat(d3.format("")));

  var y = d3.scaleLinear().domain([minY, maxY]).range([height, 0]);
  svg_second_graph.append("g").call(d3.axisLeft(y));


  // Add dots

  for (let i = 0; i < Object.keys(countrYearValues).length; i++) {
	svg_second_graph
		.append("g")
		.selectAll("dot")
		.data(Object.values(countrYearValues)[i])
		.enter()
		.append("circle")
		.attr("cx", function (d) {
			return x(d.year);
		})
		.attr("cy", function (d) {
			return y(d.value);
		})
		.attr("r", 1.5)
		.attr("fill", colors[i]);
  }

  // Add labels
  // Add X axis label:
  svg_second_graph
    .append("text")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height + margin_second_graph.top - 10)
    .text("Year");

  // Y axis label:
  svg_second_graph
    .append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin_second_graph.left + 20)
    .attr("x", -margin_second_graph.top + 20)
    .text(document.getElementById("all_metric").value);

  // Add a legend
  let title=''
  if (Object.keys(countrYearValues).length > 1) {
	Object.keys(countrYearValues).forEach((country, index) => {
		title+=country+", "
	});
  }
  else{
	title = Object.keys(countrYearValues)[0];
  } 
  

  // Title
  svg_second_graph
    .append("text")
    .attr("x", width / 2)
    .attr("y", 0 - margin_second_graph.top / 2)
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .style("font-size", "20px")
    .text(title);
}

function keepOneGraph() {
  d3.selectAll("#scatter_plot").remove();
  let parent = document.getElementById("parent");
  let child = document.createElement("div");
  child.setAttribute("id", "scatter_plot");
  parent.appendChild(child);
}

// ==================== code ========================== //


/* function getDataFromSource(){
  
  let source = document.getElementById("source").value;
  let metric = document.getElementById("metric").value;
  let selectedCountries = getSelectedOptions();
  
  



  const searching = source + metric;
  console.log(searching)

  for (let [country, year_object] of Object.entries(all_data)) {
    if (country in selectedCountries) {
      for (let [year, value] of Object.entries(year_object)) {
        console.log("-" , value.searching)
      }
    }
  }
} */


function getSelectedOptions() {
  let selectedOptions = {};
  let options = document.getElementById("countries");
  for (var option of options.options) {
    if (option.selected) {
      selectedOptions[option.value] = option.text;
    }
  }
  return selectedOptions;
}

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
  request.open("GET", file, false); // `false` makes the request synchronous
  request.send(null);

  if (request.status === 200) {
    let countriSelect = document.getElementById("countries");
    let opt, country;

    var responseText = request.responseText;
    all_data = JSON.parse(responseText);

    proccessed_data = {};
    all_data.forEach((country) => {
      // Store country data by year (key) and attributes (value)
      const country_data = Object.fromEntries(
        Object.values(country)[0].map((e) => [e.year, e])
      );

      // Get country iso_code by selecting random object and pick attribute:
      const keys = Object.keys(country_data);
      const key = keys[Math.floor(Math.random() * keys.length)];
      const iso_code = country_data[key].iso_code;
      if (iso_code != undefined) {
        proccessed_data[iso_code] = country_data;

        // dar append ao select dos países todos
        countryName = Object.values(country)[0][0].country;
        opt = document.createElement("option");
        opt.value = iso_code;
        opt.innerHTML = countryName;
        countriSelect.appendChild(opt);
      }
    });
    return proccessed_data;
  }
  return undefined;
}

function updateData() {
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

  var result = {};

  for (const [iso_code, values] of Object.entries(all_data)) {
    year_object = values[current_year];
    if (year_object == undefined || year_object[attribute] == undefined) {
      result[iso_code] = NaN;
    } else {
      value = year_object[attribute];
      result[iso_code] = +value;
    }
  }

  /* world.selectAll("path").remove();

	world.selectAll("path")
		.data([result])
		.enter()
		.append("path")
		.attr("d", d3.geoPath().projection(projection))
		.attr("fill", function(d) {
			d.total = data.get(d[attribute]) || 0;
			return colorScale(d.total);
		})
		.style("stroke", "transparent")
		.attr("class", function(d) {
			return "Country"
		})
		.attr("id", function(d) {
			return d.id
		})
		.style("opacity", 1)
		.on("click", click);

	console.log(world) */

  /* 	world.selectAll("path")
		// .data(result)
		// .transition()
		// .delay(100)
		// .duration(500)
		.attr("fill",  function(d) {
			const value = d[attribute];
			if (value) {
			  return color_legend(d[attribute]);
			} else {
			  return '#ccc';
			}
		});
 */

  return result;
}

function getDataGraph(current_country) {
  const attribute = document.getElementById("all_metric").value;
  var final = [];
  var result = {};
 
  for (const [iso_code, values] of Object.entries(all_data)) {
    if (iso_code.toLocaleLowerCase() === current_country.toLocaleLowerCase()) {
      for (const [year, year_object] of Object.entries(values)) {
        if (
          year_object[attribute] != undefined &&
          year_object[attribute] != NaN
        ) {
          result["year"] = year;
          result["value"] = parseFloat(year_object[attribute]);
          final.push(result);
          result = {};
        }
      }
    }
  }

  return final;
}

var all_data = loadAndProcessData("../js/data.json");
mapDisplay();

attribute_data = updateData();
data = d3.map(attribute_data);
