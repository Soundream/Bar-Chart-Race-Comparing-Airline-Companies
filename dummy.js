// Configuration variables
const margin = { top: 80, right: 180, bottom: 5, left: 150 };
const width = 2400;
const height = 1500;
const n = 15; // Number of bars to display
const duration = 250; // Duration of transitions in milliseconds
const flagWidth = 40; // Width of flag images

// Create SVG container
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
    .attr("transform", `translate(${width - margin.right + 10}, ${margin.top})`);

  const legendItems = legend.selectAll(".legend-item")
    .data(Object.keys(regionColors))
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`);

  legendItems.append("rect")
    .attr("x", 0)
    .attr("width", 18)
    .attr("height", 18)
    .attr("fill", d => regionColors[d]);

  legendItems.append("text")
    .attr("x", 24)
    .attr("y", 9)
    .attr("dy", "0.35em")
    .style("text-anchor", "start")
    .text(d => d);

  // Variables to hold previous data state
  const prev = new Map();

  // Animation function
  async function updateChart() {
    for (const [date, data] of keyframes) {
      const transition = svg.transition()
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
        .style("font-size", "14px")
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
              console.log(`Name: ${d.name}, Value: ${d.value}, x: ${xValue}, y: ${yValue}`);
              return `translate(${xValue},${yValue})`;
            })
            .attr("text-anchor", "start");

          // Append flag image
          g.append("image")
            .attr("x", 5)
            .attr("y", -15)
            .attr("width", 30)
            .attr("height", 20)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .attr("href", d => d.country ? `https://flagcdn.com/h20/${d.country.toLowerCase()}.png` : null);

          // Append text
          const text = g.append("text")
            .attr("x", 40)
            .attr("dy", "0.35em")
            .style("font-size", "14px");

          text.append("tspan")
            .attr("x", 40)
            .attr("dy", "-0.25em")
            .text(d => d.iata);

          text.append("tspan")
            .attr("x", 40)
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
