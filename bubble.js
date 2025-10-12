// 临时调试开关 - 显示调试信息
const DEBUG_MODE = false; // 设置为false关闭调试信息

// 筛选开关 - 控制是否只显示前15大revenue的公司
const FILTER_TOP_COMPANIES = true; // 设置为false显示所有公司
const TOP_COMPANIES_COUNT = 15; // 当FILTER_TOP_COMPANIES为true时，显示的公司数量

// Configuration variables
const marginBubble = { top: 50, right: 20, bottom: 50, left: 80 };
const widthBubble = 1000 - marginBubble.left - marginBubble.right;
const heightBubble = 700 - marginBubble.top - marginBubble.bottom;

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
  .range([8, 60]); // 增大bubble尺寸范围

// Axes
const xAxisBubble = d3.axisBottom(xScaleBubble)
  .ticks(10)
  .tickFormat(d => d + "%");

svgBubble.append("g")
  .attr("transform", `translate(0,${heightBubble})`)
  .call(xAxisBubble)
  .selectAll("text")
  .style("font-size", "14px");

const yAxisBubble = d3.axisLeft(yScaleBubble)
  .ticks(10)
  .tickFormat(d => d + "%");

svgBubble.append("g")
  .call(yAxisBubble)
  .selectAll("text")
  .style("font-size", "14px");

// Axis Labels
svgBubble.append("text")
  .attr("class", "axis-label")
  .attr("x", widthBubble / 2)
  .attr("y", heightBubble + 40)
  .style("text-anchor", "middle")
  .style("font-size", "16px")
  .style("font-weight", "bold")
  .text("EBITDA Margin TTM (%)");

svgBubble.append("text")
  .attr("class", "axis-label")
  .attr("x", -heightBubble / 2)
  .attr("y", -50)
  .attr("transform", "rotate(-90)")
  .style("text-anchor", "middle")
  .style("font-size", "16px")
  .style("font-weight", "bold")
  .text("Revenue Growth TTM (%)");

  if (yScaleBubble(0) >= 0 && yScaleBubble(0) <= heightBubble) {
    svgBubble.append("line")
        .attr("class", "zero-line")
        .attr("x1", 0)
        .attr("y1", yScaleBubble(0))
        .attr("x2", widthBubble)
        .attr("y2", yScaleBubble(0))
        .attr("stroke", "green")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,2")
        .attr("opacity", 0.5);
}

// Vertical line at x = 0%
if (xScaleBubble(0) >= 0 && xScaleBubble(0) <= widthBubble) {
    svgBubble.append("line")
        .attr("class", "zero-line")
        .attr("x1", xScaleBubble(0))
        .attr("y1", 0)
        .attr("x2", xScaleBubble(0))
        .attr("y2", heightBubble)
        .attr("stroke", "green")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,2")
        .attr("opacity", 0.5);
}

// Add x+y=40 diagonal line
// This line represents the equation x + y = 40
// We need to find the intersection points with the chart boundaries
const diagonalSlope = -1; // slope of x + y = 40 is -1
const diagonalIntercept = 40; // y = -x + 40

// Calculate intersection points with chart boundaries
// Left boundary (x = -50): y = -(-50) + 40 = 90
// Right boundary (x = 50): y = -(50) + 40 = -10
// Top boundary (y = 100): x = 40 - 100 = -60
// Bottom boundary (y = -30): x = 40 - (-30) = 70

// Check if the line intersects with the visible area
const leftY = diagonalIntercept - (-50); // y at x = -50
const rightY = diagonalIntercept - 50; // y at x = 50

if ((leftY >= -30 && leftY <= 100) || (rightY >= -30 && rightY <= 100)) {
    // Calculate the visible portion of the line
    let x1, y1, x2, y2;
    
    if (leftY >= -30 && leftY <= 100) {
        // Line intersects with left boundary
        x1 = xScaleBubble(-50);
        y1 = yScaleBubble(leftY);
    } else {
        // Line intersects with top boundary
        x1 = xScaleBubble(40 - 100);
        y1 = yScaleBubble(100);
    }
    
    if (rightY >= -30 && rightY <= 100) {
        // Line intersects with right boundary
        x2 = xScaleBubble(50);
        y2 = yScaleBubble(rightY);
    } else {
        // Line intersects with bottom boundary
        x2 = xScaleBubble(40 - (-30));
        y2 = yScaleBubble(-30);
    }
    
    svgBubble.append("line")
        .attr("class", "diagonal-line")
        .attr("x1", x1)
        .attr("y1", y1)
        .attr("x2", x2)
        .attr("y2", y2)
        .attr("stroke", "green")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5");
}

  
// Define custom colors for each region (same as in your bar chart)
const regionColors = {
  'North America': '#40E0D0',  
  'Europe': '#4169E1',       
  'Asia Pacific': '#FF4B4B', 
  'Latin America': '#32CD32',  
  'China': '#FF4B4B',          
  'Middle East': '#DEB887',   
  'Russia': '#FF4B4B',         
  'Turkey': '#DEB887',

  "Africa": "#d62728",
  "India": "#FB7C24"
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

    // Convert date to a time value (assuming 'YYYY'Q'Q' format)
    const parts = d.date.split("'Q");
    d.year = +parts[0];
    d.quarter = +parts[1];
    // Approximate date as milliseconds since epoch
    d.time = new Date(d.year, (d.quarter - 1) * 3).getTime();
  });

  // Filter out invalid data (NaN values for EBITDA or Revenue Growth)
  console.log("原始数据条数:", data.length);
  
  // 检查有多少数据被过滤掉
  const invalidData = data.filter(d => 
    isNaN(d.ebitda_margin) || 
    isNaN(d.revenue_growth) || 
    isNaN(d.revenue)
  );
  console.log("无效数据条数:", invalidData.length);
  if (invalidData.length > 0) {
    console.log("无效数据示例:", invalidData.slice(0, 5));
  }
  
  data = data.filter(d => 
    !isNaN(d.ebitda_margin) && 
    !isNaN(d.revenue_growth) && 
    !isNaN(d.revenue)
  );
  console.log("过滤后数据条数:", data.length);

  // Set domain for size scale based on revenue
  sizeScaleBubble.domain(d3.extent(data, d => d.revenue));

  // Generate keyframes
  const dateValues = Array.from(
    d3.group(data, d => d.time)
  ).sort(([a], [b]) => d3.ascending(a, b));

  // Process each quarter - optionally filter to top companies by revenue
  const processedDateValues = dateValues.map(([time, quarterData]) => {
    let processedData;
    
    if (FILTER_TOP_COMPANIES) {
      // Sort by revenue descending and take top companies
      const sortedData = quarterData.sort((a, b) => b.revenue - a.revenue);
      processedData = sortedData.slice(0, TOP_COMPANIES_COUNT);
    } else {
      // Keep all companies
      processedData = quarterData;
    }
    
    // 调试信息：检查每个季度的公司数量
    const dateStr = new Date(time).getFullYear() + "'Q" + (Math.floor(new Date(time).getMonth() / 3) + 1);
    if (FILTER_TOP_COMPANIES) {
      console.log(`${dateStr}: 总数据${quarterData.length}条, 前${TOP_COMPANIES_COUNT}名${processedData.length}条`);
    } else {
      console.log(`${dateStr}: 显示所有公司${processedData.length}条`);
    }
    
    // 返回前15名数据和完整数据，供插值函数使用
    return [time, processedData, quarterData];
  });

  const keyframes = [];
  const k = 30; // Number of interpolated frames between dates - 增加到30个keyframe

  for (let i = 0; i < processedDateValues.length - 1; i++) {
    const [timeA, dataA, fullDataA] = processedDateValues[i];
    const [timeB, dataB, fullDataB] = processedDateValues[i + 1];
    
    for (let j = 0; j < k; ++j) {
      const t = j / k;
      const currentTime = timeA * (1 - t) + timeB * t;
      const interpolatedData = interpolateData(dataB, dataA, fullDataB, fullDataA, t);
      keyframes.push([currentTime, interpolatedData]);
    }
  }
  keyframes.push([processedDateValues[processedDateValues.length - 1][0], processedDateValues[processedDateValues.length - 1][1]]);

  // Duration per transition
  const duration = 1000; // Duration of transitions in milliseconds

  // 根据调试模式决定动画开始时间
  console.log("数据加载完成，开始动画");
  console.log("处理后的季度数据:", processedDateValues.length);
  console.log("生成的keyframes:", keyframes.length);
  
  if (DEBUG_MODE) {
    // 调试模式：立即开始动画
    updateChart();
  } else {
    // 正常模式：等待15秒后开始（用于录屏）
    setTimeout(() => {
      updateChart();
    }, 15000);
  }

  async function updateChart() {
    console.log("开始更新图表，keyframes数量:", keyframes.length);
    
    // Initialize bubbles outside the loop
    let bubbles = svgBubble.selectAll(".bubble")
      .data([], d => d.company);

    for (let i = 0; i < keyframes.length; i++) {
      const [currentTime, data] = keyframes[i];
      
      if (i === 0) {
        console.log("第一帧数据:", data.length, "个公司");
        console.log("第一帧公司列表:", data.map(d => d.company));
      }
      
      // Update date label - 常驻显示季度信息
      const currentDate = new Date(currentTime);
      const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;
      const dateString = `${currentDate.getFullYear()}'Q${currentQuarter}`;
      svgBubble.selectAll(".date-label").remove();
      
      svgBubble.append("text")
        .attr("class", "date-label")
        .attr("x", widthBubble / 2)
        .attr("y", -25) // 往上移动10像素
        .style("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .style("fill", "black")
        .text(dateString);

      // 调试信息 - 只在debug模式下显示公司数量
      if (DEBUG_MODE) {
        svgBubble.selectAll(".debug-info").remove();
        svgBubble.append("text")
          .attr("class", "debug-info")
          .attr("x", 10)
          .attr("y", -60)
          .style("font-size", "14px")
          .style("fill", "red")
          .style("font-weight", "bold")
          .text(`公司数: ${data.length}`);
      }

      // Update bubbles - 使用简单的数据绑定，让D3自动处理enter/exit
      bubbles = bubbles.data(data, d => d.company);

      // Handle exits
      bubbles.exit()
        .transition()
        .duration(200)
        .style("opacity", 0)
        .remove();

      // Handle enters
      const newBubbles = bubbles.enter()
        .append("circle")
        .attr("class", "bubble")
        .attr("cx", d => xScaleBubble(d.ebitda_margin))
        .attr("cy", d => yScaleBubble(d.revenue_growth))
        .attr("r", d => sizeScaleBubble(d.revenue))
        .style("fill", d => color(d))
        .style("opacity", d => d.opacity !== undefined ? d.opacity : 0);
      
      // 对新进入的bubble进行淡入动画
      newBubbles.transition()
        .duration(200)
        .style("opacity", d => d.opacity !== undefined ? d.opacity : 0.85);
      
      bubbles = newBubbles.merge(bubbles);

      // 临时调试信息 - 在bubble中心显示公司名字
      if (DEBUG_MODE) {
        svgBubble.selectAll(".company-label").remove();
        svgBubble.selectAll(".company-label")
          .data(data)
          .enter()
          .append("text")
          .attr("class", "company-label")
          .attr("x", d => xScaleBubble(d.ebitda_margin))
          .attr("y", d => yScaleBubble(d.revenue_growth))
          .style("text-anchor", "middle")
          .style("dominant-baseline", "central")
          .style("font-size", "10px")
          .style("fill", "white")
          .style("font-weight", "bold")
          .style("pointer-events", "none")
          .text(d => d.company);
      }

      // Update titles for tooltips
      bubbles.select("title").remove();
      bubbles.append("title")
        .text(d => `${d.company}\nRegion: ${d.region}\nRevenue: ${d3.format(",")(Math.round(d.revenue))}\nEBITDA Margin: ${d.ebitda_margin.toFixed(2)}%\nRevenue Growth: ${d.revenue_growth.toFixed(2)}%`);

      // Transition bubbles to new positions
      bubbles.transition()
        .duration(200) // 恢复较短的过渡时间，因为keyframe更多了
        .attr("cx", d => xScaleBubble(d.ebitda_margin))
        .attr("cy", d => yScaleBubble(d.revenue_growth))
        .attr("r", d => sizeScaleBubble(d.revenue))
        .style("opacity", d => d.opacity !== undefined ? d.opacity : 0.85);

      // 临时调试信息 - 更新公司标签位置
      if (DEBUG_MODE) {
        svgBubble.selectAll(".company-label")
          .transition()
          .duration(200)
          .attr("x", d => xScaleBubble(d.ebitda_margin))
          .attr("y", d => yScaleBubble(d.revenue_growth));
      }

      // 添加短暂延迟，让动画更平滑
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  function interpolateData(targetQuarterData, sourceQuarterData, fullTargetData, fullSourceData, t) {
    const interpolatedData = [];
    
    // 创建所有公司的集合（源季度前15名 + 目标季度前15名）
    const allCompanies = new Set([
      ...sourceQuarterData.map(d => d.company),
      ...targetQuarterData.map(d => d.company)
    ]);

    // 为每个公司计算插值
    allCompanies.forEach(company => {
      const sourceData = sourceQuarterData.find(d => d.company === company);
      const targetData = targetQuarterData.find(d => d.company === company);
      
      if (sourceData && targetData) {
        // 两个季度都在前15名：正常插值
        interpolatedData.push({
          company: company,
          ebitda_margin: sourceData.ebitda_margin * (1 - t) + targetData.ebitda_margin * t,
          revenue_growth: sourceData.revenue_growth * (1 - t) + targetData.revenue_growth * t,
          revenue: sourceData.revenue * (1 - t) + targetData.revenue * t,
          region: targetData.region
        });
      } else if (sourceData && !targetData) {
        // 只在源季度前15名：从原位置淡出
        const fadeOutDuration = 0.8; // 0.8秒淡出
        const fadeOutProgress = Math.min(t / (fadeOutDuration / (250 * 30)), 1); // 在0.8秒内完成淡出
        
        interpolatedData.push({
          company: company,
          ebitda_margin: sourceData.ebitda_margin,
          revenue_growth: sourceData.revenue_growth,
          revenue: sourceData.revenue,
          region: sourceData.region,
          opacity: 0.85 * (1 - fadeOutProgress) // 逐渐变透明
        });
      } else if (!sourceData && targetData) {
        // 只在目标季度前15名：需要从源季度的实际位置插值到目标位置
        const fullSourceCompanyData = fullSourceData.find(d => d.company === company);
        
        const fadeInDuration = 0.8; // 0.8秒淡入
        const fadeInProgress = Math.min(t / (fadeInDuration / (250 * 30)), 1); // 在0.8秒内完成淡入
        
        if (fullSourceCompanyData) {
          // 在源季度有完整数据：从实际位置插值到目标位置
          interpolatedData.push({
            company: company,
            ebitda_margin: fullSourceCompanyData.ebitda_margin * (1 - t) + targetData.ebitda_margin * t,
            revenue_growth: fullSourceCompanyData.revenue_growth * (1 - t) + targetData.revenue_growth * t,
            revenue: fullSourceCompanyData.revenue * (1 - t) + targetData.revenue * t,
            region: targetData.region,
            opacity: 0.85 * fadeInProgress // 逐渐变不透明
          });
        } else {
          // 在源季度没有数据：从目标位置淡入
          interpolatedData.push({
            company: company,
            ebitda_margin: targetData.ebitda_margin,
            revenue_growth: targetData.revenue_growth,
            revenue: targetData.revenue,
            region: targetData.region,
            opacity: 0.85 * fadeInProgress // 逐渐变不透明
          });
        }
      }
    });

    return interpolatedData;
  }

});