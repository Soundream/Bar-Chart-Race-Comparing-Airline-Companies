// Configuration variables
const marginBubble = { top: 50, right: 50, bottom: 50, left: 70 };
const widthBubble = 960 - marginBubble.left - marginBubble.right;
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

// Load and process data
d3.csv("Bubble.csv").then(function(data) {
  // Parse data
  data.forEach(d => {
    d.ebitda_margin = +d.EBITDA; // Use EBITDA column for EBITDA margin
    d.revenue_growth = +d.Revenue; // Use Revenue column for revenue growth
    d.revenue = +d.Value; // Use Value column for revenue (actual revenue)
    d.company = d.Airline; // Company name (use 'Airline' as company)
    d.date = d.Date; // Date as string

    // Convert date to a time value (assuming 'Date' is in 'YYYY'Q'Q' format)
    const parts = d.date.split("'");
    d.year = +parts[0];
    d.quarter = +parts[1].replace('Q', '');
    // Approximate date as milliseconds since epoch
    d.time = new Date(d.year, (d.quarter - 1) * 3).getTime();
  });

  // Get unique dates for animation
  const dates = Array.from(new Set(data.map(d => d.time))).sort((a, b) => a - b);

  // Set domain for size scale based on revenue
  sizeScaleBubble.domain(d3.extent(data, d => d.revenue));

  // Prepare data grouped by company
  const dataByCompany = d3.group(data, d => d.company);

  // For each company, identify continuous data segments based on quarters
  const companySegments = new Map();

  dataByCompany.forEach((values, company) => {
    // Sort data by year and quarter
    values.sort((a, b) => {
      if (a.year !== b.year) {
        return a.year - b.year;
      } else {
        return a.quarter - b.quarter;
      }
    });

    // Identify continuous segments
    const segments = [];
    let segmentStartIndex = 0;

    for (let i = 1; i < values.length; i++) {
      const prev = values[i - 1];
      const current = values[i];

      let expectedYear = prev.year;
      let expectedQuarter = prev.quarter + 1;

      if (expectedQuarter > 4) {
        expectedQuarter = 1;
        expectedYear += 1;
      }

      if (current.year !== expectedYear || current.quarter !== expectedQuarter) {
        // Gap detected
        const segment = values.slice(segmentStartIndex, i);
        segments.push(segment);
        segmentStartIndex = i;
      }
    }
    // Add the last segment
    const lastSegment = values.slice(segmentStartIndex);
    if (lastSegment.length > 0) {
      segments.push(lastSegment);
    }

    // For each segment, create interpolators
    const interpolatedSegments = segments.map(segment => {
      const times = segment.map(d => d.time);
      return {
        startTime: times[0],
        endTime: times[times.length - 1],
        ebitdaMarginInterpolator: d3.scaleLinear()
          .domain(times)
          .range(segment.map(d => d.ebitda_margin)),
        revenueGrowthInterpolator: d3.scaleLinear()
          .domain(times)
          .range(segment.map(d => d.revenue_growth)),
        revenueInterpolator: d3.scaleLinear()
          .domain(times)
          .range(segment.map(d => d.revenue)),
      };
    });

    companySegments.set(company, interpolatedSegments);
  });

  // Initialize bubbles
  const bubbles = svgBubble.selectAll(".bubble")
    .data(Array.from(dataByCompany.keys()))
    .enter()
    .append("circle")
    .attr("class", "bubble")
    .style("fill", "steelblue")
    .style("opacity", 0);

  // Add titles for tooltips
  bubbles.append("title");

  // Start the continuous animation
  const totalDuration = 50000; // Total animation duration in milliseconds

  d3.timer(function(elapsed) {
    const currentTime = d3.min(dates) + ((elapsed % totalDuration) / totalDuration) * (d3.max(dates) - d3.min(dates));

    // Update date label
    svgBubble.selectAll(".date-label").remove();
    const currentDate = new Date(currentTime);
    const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;
    const dateString = `${currentDate.getFullYear()}'Q${currentQuarter}`;
    svgBubble.append("text")
      .attr("class", "date-label")
      .attr("x", widthBubble - 10)
      .attr("y", heightBubble - 10)
      .style("text-anchor", "end")
      .text(dateString);

    // Update bubbles
    bubbles.each(function(company) {
      const node = d3.select(this);
      const segments = companySegments.get(company);

      let interpolated = false;

      for (const segment of segments) {
        if (currentTime >= segment.startTime && currentTime <= segment.endTime) {
          // Interpolate values within this segment
          const ebitda_margin = segment.ebitdaMarginInterpolator(currentTime);
          const revenue_growth = segment.revenueGrowthInterpolator(currentTime);
          const revenue = segment.revenueInterpolator(currentTime);

          // Check if values are valid numbers
          if (isNaN(ebitda_margin) || isNaN(revenue_growth) || isNaN(revenue)) {
            node.style("opacity", 0);
            interpolated = true; // Prevent further checks
            break;
          }

          // Update position and size
          node.attr("cx", xScaleBubble(ebitda_margin))
            .attr("cy", yScaleBubble(revenue_growth))
            .attr("r", sizeScaleBubble(revenue))
            .style("opacity", 0.7);

          // Update tooltip
          node.select("title")
            .text(`${company}\nRevenue: ${d3.format(",")(Math.round(revenue))}\nEBITDA Margin: ${ebitda_margin.toFixed(2)}%\nRevenue Growth: ${revenue_growth.toFixed(2)}%`);

          interpolated = true;
          break; // Exit the loop since we've found the segment
        }
      }

      if (!interpolated) {
        // Current time is outside all data segments; hide the bubble
        node.style("opacity", 0);
      }
    });
  });
});
