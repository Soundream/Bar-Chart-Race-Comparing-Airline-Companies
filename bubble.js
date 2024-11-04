// Configuration variables
const marginBubble = { top: 50, right: 100, bottom: 50, left: 60 };
const widthBubble = 840 - marginBubble.left - marginBubble.right;
const heightBubble = 600 - marginBubble.top - marginBubble.bottom;

const svgBubble = d3.select("#bubble-chart")
  .append("svg")
  .attr("width", widthBubble + marginBubble.left + marginBubble.right)
  .attr("height", heightBubble + marginBubble.top + marginBubble.bottom)
  .append("g")
  .attr("transform", `translate(${marginBubble.left},${marginBubble.top})`);

// Scales
const xScaleBubble = d3.scaleLinear()
  .domain([-50, 50]) // Adjust domain as needed
  .range([0, widthBubble]);

const yScaleBubble = d3.scaleLinear()
  .domain([-30, 100]) // Adjust domain as needed
  .range([heightBubble, 0]); // Inverted

const sizeScaleBubble = d3.scaleSqrt()
  .range([5, 40]); // Adjust as needed

// Axes
const xAxisBubble = d3.axisBottom(xScaleBubble)
  .ticks(10)
  .tickFormat(d => d + "%");

svgBubble.append("g")
  .attr("transform", `translate(0,${heightBubble})`)
  .call(xAxisBubble);

const yAxisBubble = d3.axisLeft(yScaleBubble)
  .ticks(10)
  .tickFormat(d => d + "%");

svgBubble.append("g")
  .call(yAxisBubble);

// Axis Labels
svgBubble.append("text")
  .attr("class", "axis-label")
  .attr("x", widthBubble / 2)
  .attr("y", heightBubble + 40)
  .style("text-anchor", "middle")
  .text("EBITDA Margin (%)");

svgBubble.append("text")
  .attr("class", "axis-label")
  .attr("x", -heightBubble / 2)
  .attr("y", -50)
  .attr("transform", "rotate(-90)")
  .style("text-anchor", "middle")
  .text("Revenue Growth (%)");

// Define custom colors for each region (same as in your bar chart)
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

// Load and process data
d3.csv("Bubble.csv").then(function(data) {
  // Parse data
  data.forEach(d => {
    d.ebitda_margin = +d.EBITDA; // Use EBITDA column for EBITDA margin
    d.revenue_growth = +d.Revenue; // Use Revenue column for revenue growth
    d.revenue = +d.Value; // Use Value column for revenue (actual revenue)
    d.company = d.Airline; // Company name (use 'Airline' as company)
    d.date = d.Date; // Date as string
    d.region = d.Region; // Add region information

    // Convert date to a time value (assuming 'Date' is in 'YYYY'Q'Q' format)
    const parts = d.date.split("'");
    d.year = +parts[0];
    d.quarter = +parts[1].replace('Q', '');
    // Approximate date as milliseconds since epoch
    d.time = new Date(d.year, (d.quarter - 1) * 3).getTime();
  });

  // Set domain for size scale based on revenue
  sizeScaleBubble.domain(d3.extent(data, d => d.revenue));

  // Generate keyframes
  const dateValues = Array.from(
    d3.group(data, d => d.time)
  ).sort(([a], [b]) => d3.ascending(a, b));

  const keyframes = [];
  const k = 10; // Number of interpolated frames between dates

  for (let i = 0; i < dateValues.length - 1; i++) {
    const [timeA, dataA] = dateValues[i];
    const [timeB, dataB] = dateValues[i + 1];

    for (let j = 0; j < k; ++j) {
      const t = j / k;
      const currentTime = timeA * (1 - t) + timeB * t;
      const interpolatedData = interpolateData(dataA, dataB, t);
      keyframes.push([currentTime, interpolatedData]);
    }
  }
  keyframes.push([dateValues[dateValues.length - 1][0], dateValues[dateValues.length - 1][1]]);

  // Duration per transition
  const duration = 100; // Duration of transitions in milliseconds

  // Start the animation
  updateChart();

  async function updateChart() {
    // Initialize bubbles outside the loop
    let bubbles = svgBubble.selectAll(".bubble")
      .data([], d => d.company);

    for (const [currentTime, data] of keyframes) {
      // Update date label
      const currentDate = new Date(currentTime);
      const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;
      const dateString = `${currentDate.getFullYear()}'Q${currentQuarter}`;
      svgBubble.selectAll(".date-label").remove();
      svgBubble.append("text")
        .attr("class", "date-label")
        .attr("x", widthBubble - 10)
        .attr("y", heightBubble - 10)
        .style("text-anchor", "end")
        .text(dateString);

      // Update bubbles
      bubbles = bubbles.data(data, d => d.company);

      bubbles.exit()
        .transition()
        .duration(duration)
        .style("opacity", 0)
        .remove();

      bubbles = bubbles.enter()
        .append("circle")
        .attr("class", "bubble")
        .attr("cx", d => xScaleBubble(d.ebitda_margin))
        .attr("cy", d => yScaleBubble(d.revenue_growth))
        .attr("r", d => sizeScaleBubble(d.revenue))
        .style("fill", d => color(d))
        .style("opacity", 0)
        .merge(bubbles);

      // Update titles for tooltips
      bubbles.select("title").remove();
      bubbles.append("title")
        .text(d => `${d.company}\nRegion: ${d.region}\nRevenue: ${d3.format(",")(Math.round(d.revenue))}\nEBITDA Margin: ${d.ebitda_margin.toFixed(2)}%\nRevenue Growth: ${d.revenue_growth.toFixed(2)}%`);

      // Transition bubbles to new positions
      const transition = bubbles.transition()
        .duration(duration)
        .attr("cx", d => xScaleBubble(d.ebitda_margin))
        .attr("cy", d => yScaleBubble(d.revenue_growth))
        .attr("r", d => sizeScaleBubble(d.revenue))
        .style("opacity", 0.7);

      // Wait for the transition to end before moving to the next frame
      await transition.end();
    }
  }

  function interpolateData(dataA, dataB, t) {
    const dataMapA = new Map(dataA.map(d => [d.company, d]));
    const dataMapB = new Map(dataB.map(d => [d.company, d]));

    const companies = new Set([...dataMapA.keys(), ...dataMapB.keys()]);

    const interpolatedData = [];

    companies.forEach(company => {
      const dA = dataMapA.get(company);
      const dB = dataMapB.get(company);

      if (dA && dB) {
        // Both times have data for this company
        interpolatedData.push({
          company: company,
          ebitda_margin: dA.ebitda_margin * (1 - t) + dB.ebitda_margin * t,
          revenue_growth: dA.revenue_growth * (1 - t) + dB.revenue_growth * t,
          revenue: dA.revenue * (1 - t) + dB.revenue * t,
          region: dA.region // Assume region doesn't change
        });
      } else if (dA) {
        // Only in dataA
        interpolatedData.push({
          company: company,
          ebitda_margin: dA.ebitda_margin * (1 - t),
          revenue_growth: dA.revenue_growth * (1 - t),
          revenue: dA.revenue * (1 - t),
          region: dA.region
        });
      } else if (dB) {
        // Only in dataB
        interpolatedData.push({
          company: company,
          ebitda_margin: dB.ebitda_margin * t,
          revenue_growth: dB.revenue_growth * t,
          revenue: dB.revenue * t,
          region: dB.region
        });
      }
    });

    return interpolatedData;
  }
});