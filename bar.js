// Configuration variables for the timeline
const marginTimeline = { top: 120, right: 10, bottom: 100, left: 250 };
const widthTimeline = 1500 - marginTimeline.left - marginTimeline.right;
const heightTimeline = 250 - marginTimeline.top - marginTimeline.bottom;

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

// Group for announcements
const announcementGroup = svgTimeline.append("g")
  .attr("class", "announcement-group");

// Maximum number of announcements to display
const maxAnnouncements = 3;

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
const margin = { top: 200, right: 100, bottom: 60, left: 150 };
const width = 1000;
const height = 1500;
const n = 15; // Number of bars to display
const duration = 100; // Duration of transitions in milliseconds

// Create SVG container for the bar chart
const svg = d3.select("#chart")
  .append("svg")
  .attr("viewBox", [0, 0, width, height]);

// Parse the events data
const eventsDataRaw = `Jan'2000\tRyanair launches online booking system. First major airline to start selling direct\t2000
Jan'2000\tAir Canada acquires its main rival Canadian Airlines\t2000
Feb'2000\tJetBlue maiden flight\t2000
Apr'2000\tEasyJet launches own online booking system\t2000
Jun'2000\tDelta, Air France, Aeromexico and Korean Air form SkyTeam Alliance\t2000
Nov'2000\tEasyJet lists on London Stock Exchange\t2000
Jan'2001\tTrans World Airlines (TWA) files for Chapter 11 bankruptcy protection (3rd time)\t2001
Jan'2001\tGol Linhas Aéreas maiden flight\t2001
Apr'2001\tAmerican Airlines acquires TWA, retiring the brand\t2001
Aug'2001\tComair launches low-cost subsidiary Kulula\t2001
Sep'2001\t9/11 terrorist attacks\t2001
Apr'2002\tJetBlue lists on NASDAQ\t2002
Apr'2002\tEasyJet acquires British low-cost carrier Go Fly\t2002
Apr'2002\tNorwegian Air Shuttle maiden flight\t2002
Oct'2002\tJapan Airlines merges with Japan Air System forming JAL Group\t2002
Nov'2002\tChina Southern merges with China Northern and Xinjiang Airlines\t2002
Dec'2002\tUnited files for Chapter 11 bankruptcy protection\t2002
Mar'2003\tHawaiian Airlines files for Chapter 11 bankruptcy protection\t2003
Apr'2003\tAir Canada files for Chapter 11 bankruptcy protection\t2003
Oct'2003\tAir Arabia maiden flight\t2003
Dec'2003\tNorwegian Air Shuttle lists on Oslo Stock Exchange\t2003
May'2004\tAir France merges with KLM forming Air France-KLM\t2004
May'2004\tWizz Air maiden flight\t2004
May'2004\tQantas launches low-cost subsidiary, Jetstar\t2004
May'2004\tGol Linhas Aéreas lists on NYSE and Sao Paulo Stock Exchange\t2004
Dec'2004\tAir China lists on Hong Kong Stock Exchange\t2004
Mar'2005\tLufthansa acquires Swiss International Air Lines (SWISS)\t2005
May'2005\tSpiceJet maiden flight\t2005
May'2005\tJet Airways lists on Bombay Stock Exchange\t2005
Jul'2005\tSpring Airlines maiden flight\t2005
Sep'2005\tSkyWest acquires Atlantic Southeast Airlines (ASA) from Delta Air Lines\t2005
Sep'2005\tDelta Air Lines files for Chapter 11 bankruptcy protection\t2005
Sep'2005\tNorthwest Airlines files for Chapter 11 bankruptcy protection\t2005
Oct'2005\tJazeera Airways maiden flight\t2005
Dec'2005\tCopa Holdings lists on NYSE\t2005
Jun'2006\tHainan Airlines acquires Hong Kong Airlines\t2006
Aug'2006\tIndiGo maiden flight\t2006
Sep'2006\tCathay Pacific acquires Dragonair. Rebranded to Cathay Dragon in 2016\t2006
Sep'2006\tJuneyao Airlines maiden flight\t2006
Dec'2006\tAllegiant Travel lists on NASDAQ\t2006
Apr'2007\tNorwegian Air Shuttle acquires FlyNordic from Finnair\t2007
Apr'2007\tGol Linhas Aéreas acquires Varig\t2007
Jul'2007\tAir Arabia lists on Dubai Financial Market\t2007
Oct'2007\tAirbus A380 maiden flight (Singapore Airlines)- world's largest aircraft\t2007
Dec'2007\tRoyal Jordanian lists on Amman Stock Exchange\t2007
Jun'2008\tJazeera Airways lists on Kuwait Stock Exchange\t2008
Jul'2008\tOil reaches $147 per barrel\t2008
Oct'2008\tDelta merges with Northwest Airlines. Northwest brand retired in 2010\t2008
Dec'2008\tLufthansa acquires Austrian Airlines\t2008
Dec'2008\tTurkish Airlines lists on Istanbul Stock Exchange\t2008
Apr'2009\tAir Arabia launches Morocco-based subsidiary Air Arabia Maroc\t2009
May'2009\tJet Airways launches low-cost subsidiary Jet Konnect\t2009
Sep'2009\tLufthansa invests in Brussels Airlines, acquiring it in 2016\t2009
Jan'2010\tJapan Airlines files for bankruptcy\t2010
Feb'2010\tChina Eastern merges with Shanghai Airlines\t2010
Apr'2010\tEyjafjallajökull volcano erupts, >100k flights grounded\t2010
May'2010\tUnited merges with Continental Airlines. Continental brand retired in 2012\t2010
May'2010\tAir China launches Beijing Capital Airlines\t2010
Jun'2010\tAir Arabia launches Egypt-based subsidiary Air Arabia Egypt\t2010
Nov'2010\tSkyWest acquires ExpressJet Airlines\t2010
Nov'2010\tAir China acquires majority of Shenzhen Airlines\t2010
Jan'2011\tBritish Airways and Iberia merge to form International Airlines Group (IAG)\t2011
May'2011\tSouthwest acquires AirTran Airways\t2011
May'2011\tSpirit Airlines lists on NASDAQ\t2011
Oct'2011\tBoeing 787 Dreamliner maiden flight (All Nippon Airways)\t2011
Nov'2011\tAmerican Airlines files for Chapter 11 bankruptcy protection\t2011
Nov'2011\tAeroflot merges with several regional carriers- Rossiya Airlines, Vladivostok Avia, Saratov Airlines, Donavia\t2011
Apr'2012\tIAG acquires British Midland International (BMI) from Lufthansa\t2012
Jun'2012\tSingapore Airlines launches its own low-cost carrier, Scoot\t2012
Jun'2012\tLAN Airlines and TAM Airlines merge forming LATAM Airlines. Brands merge in 2016\t2012
Nov'2012\tIAG acquires controlling stake in Vueling\t2012
Feb'2013\tAmerican Airlines merger with US Airways becoming largest airline in the world\t2013
Jul'2013\tDelta Air Lines buys 49% of Virgin Atlantic from Singapore Airlines\t2013
Oct'2013\tKorean Air acquires 44% of Czech Airlines\t2013
Dec'2013\tANA launches low-cost subsidiary, Vanilla Air\t2013
Jul'2014\tChina Eastern launches China United Airlines low-cost subsidiary\t2014
Dec'2014\tAeroflot launches low-cost subsidiary Pobeda\t2014
Jan'2015\tSpring Airlines lists on Shanghai Stock Exchange\t2015
Feb'2015\tLufthansa launches own low-cost carrier, Eurowings\t2015
Feb'2015\tWizz Air lists on London Stock Exchange\t2015
Mar'2015\tAmerican Airlines' stock added to S&P 500 Index\t2015
Mar'2015\tJuneyao Airlines lists on Shanghai Stock Exchange\t2015
May'2015\tAir Arabia launches Jordan-based subsidiary Air Arabia Jordan\t2015
Aug'2015\tIAG acquires Aer Lingus for €1.4 billion\t2015
Oct'2015\tIndiGo lists on Bombay Stock Exchange\t2015
Nov'2016\tGovernment bails out Kenya Airways\t2016
Apr'2017\tANA fully acquires lcc Peach Aviation. Vanilla Air brand retired in 2019 with fleet added to Peach\t2017
Oct'2017\tLufthansa acquires Air Berlin assets\t2017
Dec'2017\tAir France-KLM launches Joon targeting millennials. Brand discontinued in 2019\t2017
Aug'2018\tRyanair acquires Lauda\t2018
Sep'2018\tTurkish Airlines acquires 49% of Air Albania\t2018
Oct'2018\tFirst Boeing 737 MAX crash\t2018
Mar'2019\tSecond Boeing 737 MAX crash. All 737 MAX aircraft grounded until Dec'2020\t2019
Apr'2019\tJet Airways suspends operations. Resumes operations in 2022\t2019
May'2019\tWestJet Airlines taken private by Onex Corporation\t2019
Jul'2019\tKenya Airways nationalized\t2019
Aug'2019\tIAG acquires Air Europa for €1 billion, revised down to €500 million in 2021 (pandemic)\t2019
Feb'2020\tStart of COVID-19 pandemic. Worldwide travel restrictions\t2020
May'2020\tNorwegian government bails out Norwegian Air Shuttle\t2020
May'2020\tLATAM files for Chapter 11 bankruptcy protection\t2020
Jul'2021\tAir Arabia launches UAE-based subsidiary Air Arabia Abu Dhabi\t2021
Oct'2020\tANA launches AirJapan, a long-haul, low-cost carrier\t2020
Oct'2020\tCathay Pacific retires Cathay Dragon\t2020
Nov'2020\tKorean Air acquires Asiana Airlines\t2020
Jan'2021\tHainan Airlines files for bankruptcy\t2021
Sep'2021\tEasyJet rejects hostile takeover bid by Wizz Air. Raises £1.2 billion through a rights issue instead\t2021
Sep'2021\tAir Arabia launches Armenia-based subsidiary Fly Arna\t2021
Feb'2022\tSpirit announces intention to be acquired by Frontier Airlines\t2022
Apr'2022\tJetBlue proposes to acquire Spirit outbidding Frontier, agreement reached in July\t2022
Jan'2024\tUS Justice Department blocks the JetBlue-Spirit deal ending JetBlue's takeover attempt\t2024`;

// Function to parse the events data
function parseEventsData(rawData) {
  const events = [];
  const lines = rawData.trim().split('\n');
  for (let line of lines) {
    const parts = line.split('\t');
    if (parts.length >= 2) {
      const [dateStr, description] = parts;
      const [monthYear, rest] = dateStr.split("'");
      const [monthStr, yearStr] = [monthYear.trim(), rest.trim()];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthIndex = monthNames.indexOf(monthStr);
      const year = parseInt(yearStr);
      if (monthIndex >= 0 && !isNaN(year)) {
        const date = new Date(year, monthIndex, 1);
        events.push({
          date: date,
          description: description.trim()
        });
      }
    }
  }
  return events;
}

// Parse the events
const eventsData = parseEventsData(eventsDataRaw);

// Mapping of three-letter country codes to two-letter ISO codes
const countryCodeMap = {
  'USA': 'us',
  'GBR': 'gb',
  'CAN': 'ca',
  'AUS': 'au',
  'IND': 'in',
  'CHN': 'cn',
  'JPN': 'jp',
  'FRA': 'fr',
  'DEU': 'de',
  'RUS': 'ru',
  'TUR': 'tr',
  'BRA': 'br',
  'MEX': 'mx',
  'KOR': 'kr',
  'ZAF': 'za',
  'KEN': 'ke',
  'IRL': 'ie',
  'ESP': 'es',
  'ITA': 'it',
  'SWE': 'se',
  'NOR': 'no',
  'FIN': 'fi',
  'CHE': 'ch',
  'NLD': 'nl',
  'BEL': 'be',
  'AUT': 'at',
  'POL': 'pl',
  'CZE': 'cz',
  'HUN': 'hu',
  'PRT': 'pt',
  'GRC': 'gr',
  'ISR': 'il',
  'SAU': 'sa',
  'ARE': 'ae',
  'QAT': 'qa',
  'EGY': 'eg',
  'ARG': 'ar',
  'COL': 'co',
  'CHL': 'cl',
  'PER': 'pe',
  'NZL': 'nz',
  'THA': 'th',
  'SGP': 'sg',
  'MYS': 'my',
  'IDN': 'id',
  'PHL': 'ph',
  'VNM': 'vn',
  // Add other country codes as needed
};

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
  const countryCodeRaw = d.CountryCode ? d.CountryCode.trim().toUpperCase() : null;
  const countryCode = countryCodeRaw ? countryCodeMap[countryCodeRaw] : null; // Map to two-letter code
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
    .style("opacity", 0)
    .text(formatDate(keyframes[0][0]));

  const lablel = svg.append("text")
    .attr("class", "label")
    .attr("text-anchor", "end")
    .attr("x", width - 180)
    .attr("y", height - 45) 
    .attr("dy", "0.32em")
    .style("font-size", "35px")
    .style("font-weight", "bold")
    .style("opacity", 1)
    .text("Revenue TTM (in millions)");

  // Remove old legend if necessary
  svg.select(".legend").remove();

  // Add legend for regions with custom colors
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - margin.right - 80}, ${margin.top + 600})`);

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

  // Variables for announcements
  let activeAnnouncements = [];

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
            .attr("href", d => d.country ? `https://flagcdn.com/h20/${d.country.toLowerCase()}.png` : null);

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

      // Update announcements
      updateAnnouncements(date, transition);

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
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${month}'${year}`;
  }

  // Function to update announcements
  function updateAnnouncements(currentDate, transition) {
    // Check for events matching the current date based on year, month, and day
    const newEvents = eventsData.filter(event =>
      event.date.getFullYear() === currentDate.getFullYear() &&
      event.date.getMonth() === currentDate.getMonth() &&
      event.date.getDate() === currentDate.getDate()
    );
  
    // Add new events to activeAnnouncements at the beginning
    activeAnnouncements.unshift(...newEvents);
  
    // Keep only the last 'maxAnnouncements' events
    activeAnnouncements = activeAnnouncements.slice(0, maxAnnouncements);
  
    // Bind data to announcements
    const announcements = announcementGroup.selectAll(".announcement")
      .data(activeAnnouncements, d => d.description);
  
    // Adjust the starting Y position for announcements
    const announcementYOffset = -30; // Adjust as needed
  
    // Enter new announcements
    announcements.enter()
      .append("text")
      .attr("class", (d, i) => `announcement ${i === 0 ? "current" : "past"}`)
      .attr("x", 10) // Left margin of 10 pixels
      .attr("y", (d, i) => announcementYOffset - 30 * i)
      .attr("text-anchor", "start") // Left-align the text
      .style("font-size", (d, i) => (i === 0 ? "20px" : "20px"))
      .style("font-weight", (d, i) => (i === 0 ? "bold" : "normal"))
      .style("opacity", 0)
      .text(d => `${formatDate(d.date)}: ${d.description}`)
      .transition(transition)
      .style("opacity", (d, i) => (i === 0 ? 1 : 0.7));
  
    // Update existing announcements
    announcements
      .attr("class", (d, i) => `announcement ${i === 0 ? "current" : "past"}`)
      .transition(transition)
      .attr("y", (d, i) => announcementYOffset - 30 * i)
      .style("opacity", (d, i) => (i === 0 ? 1 : 0.5))
      .style("font-size", (d, i) => (i === 0 ? "20px" : "16px"))
      .style("font-weight", (d, i) => (i === 0 ? "bold" : "normal"))
      .text(d => `${formatDate(d.date)}: ${d.description}`);
  
    // Exit old announcements
    announcements.exit()
      .transition(transition)
      .style("opacity", 0)
      .remove();
  }

  // Start the animation
  updateChart();

}).catch(function(error) {
  console.error("Error loading or parsing data:", error);
});