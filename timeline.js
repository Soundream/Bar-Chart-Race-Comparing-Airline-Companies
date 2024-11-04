// Retrieve dates and duration per frame from localStorage
const storedDates = JSON.parse(localStorage.getItem('animationDates'));
const durationPerFrame = parseInt(localStorage.getItem('durationPerFrame'), 10);

// Configuration variables
const marginTimeline = { top: 20, right: 10, bottom: 20, left: 250 };
const widthTimeline = 1500 - marginTimeline.left - marginTimeline.right;
const heightTimeline = 100 - marginTimeline.top - marginTimeline.bottom;

// Create SVG container
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

// Now call initTimeline after variables are declared
if (storedDates && durationPerFrame) {
  const parsedDates = storedDates.map(d => new Date(d));
  initTimeline(parsedDates, durationPerFrame);
} else {
  console.error("Failed to retrieve dates or durationPerFrame from localStorage.");
}

// Function to initialize the timeline
function initTimeline(dates, durationPerFrame) {
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

  // Start the animation
  animateTimeline(dates, durationPerFrame);
}

// Function to animate the timeline
function animateTimeline(dates, durationPerFrame) {
  let index = 0;

  function updateMarker() {
    if (index >= dates.length) {
      return; // Animation ends
    }

    const currentDate = dates[index];
    const xPosition = timeScale(currentDate);

    timelineMarker.transition()
      .duration(durationPerFrame)
      .ease(d3.easeLinear)
      .attr("x1", xPosition)
      .attr("x2", xPosition)
      .on("end", () => {
        index++;
        updateMarker();
      });
  }

  updateMarker();

  xAxisTimeline.selectAll(".tick")
  .classed("year-tick", function(d) { return d.getMonth() === 0; })
  .classed("quarter-tick", function(d) { return d.getMonth() !== 0; });
}