// Configuration variables for the timeline
const marginTimeline = { top: 20, right: 10, bottom: 20, left: 250 };
const widthTimeline = 1500 - marginTimeline.left - marginTimeline.right;
const heightTimeline = 100 - marginTimeline.top - marginTimeline.bottom;

// Create SVG container for the timeline
const svgTimeline = d3.select("#timeline-container")
  .append("svg")
  .attr("id", "timeline")
  .attr("width", widthTimeline + marginTimeline.left + marginTimeline.right)
  .attr("height", heightTimeline + marginTimeline.top + marginTimeline.bottom)
  .append("g")
  .attr("transform", `translate(${marginTimeline.left},${marginTimeline.top})`);

// Create the axis group
const xAxisTimeline = svgTimeline.append("g")
  .attr("transform", `translate(0, ${heightTimeline / 2})`)
  .attr("class", "timeline-axis");

// Add the timeline line
svgTimeline.append("line")
  .attr("class", "timeline-line")
  .attr("x1", 0)
  .attr("x2", widthTimeline)
  .attr("y1", heightTimeline / 2)
  .attr("y2", heightTimeline / 2)
  .attr("stroke", "black");

// Add the moving marker (stick)
const timelineMarker = svgTimeline.append("line")
  .attr("class", "timeline-marker")
  .attr("x1", 0)
  .attr("x2", 0)
  .attr("y1", 0)
  .attr("y2", heightTimeline)
  .attr("stroke", "red")
  .attr("stroke-width", 2);

let timeScale; // Declare timeScale in a scope accessible to all functions

// Function to initialize the timeline
function initTimeline(dates) {
  // Create the time scale
  timeScale = d3.scaleTime()
    .domain(d3.extent(dates))
    .range([0, widthTimeline]);

  // Create the axis with quarterly ticks but label only the years
  const axis = d3.axisBottom(timeScale)
    .ticks(d3.timeMonth.every(3)) // Ticks every quarter
    .tickFormat(function(date) {
      // Label only at the start of the year (January)
      return date.getMonth() === 0 ? d3.timeFormat("%Y")(date) : "";
    });

  // Call the axis
  xAxisTimeline.call(axis);

  // Adjust tick sizes after the axis is rendered
  xAxisTimeline.selectAll(".tick")
    .each(function(d) {
      const tick = d3.select(this);
      if (d.getMonth() === 0) {
        // Year tick: make it longer
        tick.select("line")
          .attr("y2", 6); // Longer tick for years
      } else {
        // Quarter tick: make it shorter
        tick.select("line")
          .attr("y2", 3); // Shorter tick for quarters
      }
    });

  xAxisTimeline.selectAll(".tick")
    .classed("year-tick", function(d) { return d.getMonth() === 0; })
    .classed("quarter-tick", function(d) { return d.getMonth() !== 0; });
}

// Configuration variables for the bar chart
const margin = { top: 80, right: 100, bottom: 5, left: 150 };
const width = 1000;
const height = 1500;
const n = 15; // Number of bars to display
const duration = 100; // Duration of transitions in milliseconds

// Create SVG container for the bar chart
const svg = d3.select("#chart")
  .append("svg")
  .attr("viewBox", [0, 0, width, height]);

// Load and parse data
d3.csv("airlines_ideal_format.csv", function(d) {
  if (!d.Date) {
    console.warn("Missing date for row:", d);
    return null; // Skip this row
  }
  const [year, quarter] = d.Date.split("'Q");
  if (!year || !quarter) {
    console.warn("Invalid date format for row:", d);
    return null; // Skip this row
  }
  const month = (parseInt(quarter) - 1) * 3; // Convert quarter to month

  // Handle CountryCode and Country safely
  const countryCode = d.CountryCode ? d.CountryCode.trim().toUpperCase() : null;
  const country = d.Country ? d.Country.trim() : null;

  // Parse value and handle NaN
  const value = parseFloat(d.Value);
  return {
    date: new Date(parseInt(year), month, 1),
    name: d.Airline,
    iata: d.IATA,
    value: isNaN(value) ? 0 : value, // Default to 0 if NaN
    region: d.Region,
    countryCode: countryCode,
    country: country
  };
}).then(function(data) {
  // Filter out any null values and invalid numbers
  data = data.filter(d => d !== null && !isNaN(d.value) && d.name);

  if (data.length === 0) {
    console.error("No valid data loaded.");
    return;
  }

  // Data preparation
  const names = new Set(data.map(d => d.name));

  // Create mappings
  const nameToRegion = new Map(data.map(d => [d.name, d.region]));
  const nameToIATA = new Map(data.map(d => [d.name, d.iata]));
  const nameToCountryCode = new Map(data.map(d => [d.name, d.countryCode]));
  const nameToCountry = new Map(data.map(d => [d.name, d.country]));

  // Group data by date and name
  const datevalues = Array.from(
    d3.rollup(
      data,
      v => v[0].value,
      d => +d.date,
      d => d.name
    )
  )
    .map(([date, dataMap]) => [new Date(date), dataMap])
    .sort(([a], [b]) => d3.ascending(a, b));

  // Generate keyframes
  const keyframes = [];
  const k = 10; // Number of interpolated frames between dates

  for (let i = 0; i < datevalues.length - 1; i++) {
    const [ka, a] = datevalues[i];
    const [kb, b] = datevalues[i + 1];
    for (let j = 0; j < k; ++j) {
      const t = j / k;
      keyframes.push([
        new Date(ka * (1 - t) + kb * t),
        rank(
          name => (a.get(name) || 0) * (1 - t) + (b.get(name) || 0) * t
        )
      ]);
    }
  }
  keyframes.push([
    new Date(datevalues[datevalues.length - 1][0]),
    rank(name => datevalues[datevalues.length - 1][1].get(name) || 0)
  ]);

  // Extract dates from keyframes
  const dates = keyframes.map(([date]) => date);

  // Initialize the timeline with dates
  initTimeline(dates);

  function rank(value) {
    const data = Array.from(names, name => ({
      name,
      value: value(name),
      region: nameToRegion.get(name),
      iata: nameToIATA.get(name),
      countryCode: nameToCountryCode.get(name),
      country: nameToCountry.get(name)
    }));
    data.sort((a, b) => d3.descending(a.value, b.value));
    return data.slice(0, n);
  }

  // Define custom colors for each region
  const regionColors = {
    "North America": "#0A3161",
    "Europe": "#ff7f0e",
    "Asia Pacific": "#FFFF66",
    "Africa": "#d62728",
    "China": "#EE1C25",
    "LATAM": "#008000",
    "India": "#FB7C24",
    "Middle East": "#006400",
    "Russia": "#1C3578",
    "Turkey": "#C8102E",
    // Add more regions and colors as needed
  };

  // Color function based on regions with custom colors
  const color = d => regionColors[d.region] || "#7f7f7f"; // Default to gray if region not found

  // Scales
  const x = d3.scaleLinear()
    .range([margin.left + 5, width - margin.right]);

  const y = d3.scaleBand()
    .rangeRound([margin.top, height - margin.bottom])
    .padding(0.1);

  // Append groups in the correct order
  const barGroup = svg.append("g");
  const labelGroup = svg.append("g");

  // Axis
  const xAxis = svg.append("g")
    .attr("transform", `translate(0,${margin.top})`)
    .attr("class", "axis");

  const yAxis = svg.append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left},0)`);

  // Ticker (date display)
  const ticker = svg.append("text")
    .attr("class", "ticker")
    .attr("text-anchor", "end")
    .attr("x", width - 6)
    .attr("y", height - 25)
    .attr("dy", "0.32em")
    .style("font-size", "48px")
    .style("font-weight", "bold")
    .style("opacity", 0.75)
    .text(formatDate(keyframes[0][0]));

  // Remove old legend if necessary
  svg.select(".legend").remove();

  // Add legend for regions with custom colors
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - margin.right - 80}, ${margin.top + 700})`);

  const legendItems = legend.selectAll(".legend-item")
    .data(Object.keys(regionColors))
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * 60})`);

  legendItems.append("rect")
    .attr("x", 0)
    .attr("width", 50)
    .attr("height", 50)
    .attr("fill", d => regionColors[d]);

  legendItems.append("text")
    .attr("x", 60)
    .attr("y", 30)
    .attr("dy", "0.35em")
    .style("text-anchor", "start")
    .style("font-size", "25px")
    .text(d => d);

  // Variables to hold previous data state
  const prev = new Map();

  // Animation function
  async function updateChart() {
    for (const [date, data] of keyframes) {
      const transition = d3.transition()
        .duration(duration)
        .ease(d3.easeLinear);

      const topData = data.slice(0, n);

      // Update y-scale domain
      y.domain(topData.map(d => d.name));

      // Update y-axis
      yAxis.transition(transition)
        .call(d3.axisLeft(y)
          .tickSize(0)
          .tickPadding(6)
        )
        .selectAll(".tick text")
        .style("font-size", "30px")
        .style("text-anchor", "end")
        .attr("x", -5); // Adjust as needed

      // Update x-scale domain
      x.domain([0, d3.max(topData, d => d.value)]);

      // Update x-axis
      xAxis.transition(transition).call(
        d3.axisTop(x)
          .ticks(width / 160)
          .tickSizeOuter(0)
      );

      // Update bars
      const bars = barGroup.selectAll(".bar")
        .data(topData, d => d.name);

      bars.join(
        enter => enter.append("rect")
          .attr("class", "bar")
          .attr("fill", d => color(d))
          .attr("x", x(0))
          .attr("y", d => y(d.name))
          .attr("height", y.bandwidth())
          .attr("width", d => x(d.value) - x(0))
          .call(enter => enter.transition(transition)
            .attr("y", d => y(d.name))
          ),
        update => update.call(update => update.transition(transition)
          .attr("width", d => x(d.value) - x(0))
          .attr("y", d => y(d.name))
        ),
        exit => exit.call(exit => exit.transition(transition)
          .attr("width", x(0))
          .remove()
        )
      );

      // Update labels
      const labels = labelGroup.selectAll(".label")
        .data(topData, d => d.name);

      labels.join(
        enter => {
          const g = enter.append("g")
            .attr("class", "label")
            .attr("transform", d => {
              const xValue = x(d.value);
              const yValue = y(d.name) + y.bandwidth() / 2;
              return `translate(${xValue},${yValue})`;
            })
            .attr("text-anchor", "start");

          // Append flag image
          g.append("image")
            .attr("x", 5)
            .attr("y", -22)
            .attr("width", 60)
            .attr("height", 40)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .attr("href", d => d.countryCode ? `https://flagcdn.com/h20/${d.countryCode.toLowerCase()}.png` : null);

          // Append text
          const text = g.append("text")
            .attr("x", 40)
            .attr("dy", "0.35em")
            .style("font-size", "30px");

          text.append("tspan")
            .attr("x", 80)
            .attr("dy", "-0.25em")
            .text(d => d.iata);

          text.append("tspan")
            .attr("x", 80)
            .attr("dy", "1.15em")
            .attr("fill-opacity", 0.7)
            .attr("font-weight", "normal")
            .text(d => d3.format(",")(d.value));

          // Transition for the group
          g.transition(transition)
            .attr("transform", d => {
              const xValue = x(d.value);
              const yValue = y(d.name) + y.bandwidth() / 2;
              return `translate(${xValue},${yValue})`;
            });

          return g;
        },
        update => update,
        exit => exit.transition(transition)
          .attr("transform", d => `translate(${x(d.value)},${height})`)
          .remove()
      )
        .call(label => label.transition(transition)
          .attr("transform", d => `translate(${x(d.value)},${y(d.name) + y.bandwidth() / 2})`)
          .call(g => g.select("text").select("tspan:nth-child(2)")
            .tween("text", function(d) {
              const i = d3.interpolateNumber((prev.get(d.name) || d).value, d.value);
              return function(t) {
                d3.select(this).text(d3.format(",")(Math.ceil(i(t))));
              };
            })
          )
        );

      // Update ticker
      ticker.transition(transition)
        .text(formatDate(date));

      // Update the timeline marker position
      const xPosition = timeScale(date);
      timelineMarker.transition(transition)
        .attr("x1", xPosition)
        .attr("x2", xPosition);

      // Update previous data
      prev.clear();
      for (const d of topData) {
        prev.set(d.name, d);
      }

      // Wait for the transition to end before proceeding to the next frame
      await transition.end();
    }
  }

  // Helper function to format date
  function formatDate(date) {
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `${date.getFullYear()}'Q${quarter}`;
  }

  // Start the animation
  updateChart();

}).catch(function(error) {
  console.error("Error loading or parsing data:", error);
});