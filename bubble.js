// Debug开关 - 设置为false时会在动画开始前等待15秒
const DEBUG_MODE = false;

// 只显示曾经进入过前15名的航空公司
const TOP_COMPANIES_COUNT = 15;

// Configuration variables
const marginBubble = { top: 50, right: 20, bottom: 100, left: 80 };
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

// Add "Rule of 40" label at fixed position
svgBubble.append("text")
    .attr("class", "rule-of-40-label")
    .attr("x", xScaleBubble(-40)) // EBITDA margin = -40%
    .attr("y", yScaleBubble(85)) // Revenue growth = 90%
    .style("text-anchor", "start")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .style("fill", "green")
    .style("opacity", 0.9)
    .text("Rule of 40");

  
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


// 根据时间和航空公司名称返回正确的IATA代码
function getDisplayIATA(company, iata, year, quarter) {
  // 2004年Q2之前（不包括Q2），把"AF/KL"显示为"AF"
  if (company.includes("Air France") && iata === "AF/KL") {
    if (year < 2004 || (year === 2004 && quarter <= 2)) {
      return "AF";
    }
  }
  
  // 2011年Q1之前（不包括Q1），把"IAG"显示为"BA"
  if (company.includes("IAG") && iata === "IAG") {
    if (year < 2011 || (year === 2011 && quarter <= 1)) {
      return "BA";
    }
  }
  
  // 其他情况返回原始IATA代码
  return iata;
}

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
    
    // 根据时间和航空公司名称设置正确的IATA代码
    d.iata = getDisplayIATA(d.company, d.IATA, d.year, d.quarter);
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

  // 找出所有曾经进入过前15名的航空公司
  const dateValues = Array.from(
    d3.group(data, d => d.time)
  ).sort(([a], [b]) => d3.ascending(a, b));

  let topCompaniesSet = new Set();
  dateValues.forEach(([time, quarterData]) => {
    const sortedData = quarterData.sort((a, b) => b.revenue - a.revenue);
    const topCompanies = sortedData.slice(0, TOP_COMPANIES_COUNT);
    topCompanies.forEach(d => topCompaniesSet.add(d.company));
  });
  console.log(`曾经进入前${TOP_COMPANIES_COUNT}名的航空公司总数: ${topCompaniesSet.size}`);
  console.log('这些航空公司:', Array.from(topCompaniesSet));

  // 过滤数据，只保留曾经进入过前15名的航空公司
  data = data.filter(d => topCompaniesSet.has(d.company));
  console.log("筛选后数据条数:", data.length);

  // 重新生成keyframes
  const processedDateValues = Array.from(
    d3.group(data, d => d.time)
  ).sort(([a], [b]) => d3.ascending(a, b));

  const keyframes = [];
  const k = 30; // Number of interpolated frames between dates - 增加到30个keyframe

  for (let i = 0; i < processedDateValues.length - 1; i++) {
    const [timeA, dataA] = processedDateValues[i];
    const [timeB, dataB] = processedDateValues[i + 1];
    
    for (let j = 0; j < k; ++j) {
      const t = j / k;
      const currentTime = timeA * (1 - t) + timeB * t;
      const interpolatedData = interpolateData(dataB, dataA, t);
      keyframes.push([currentTime, interpolatedData]);
    }
  }
  keyframes.push([processedDateValues[processedDateValues.length - 1][0], processedDateValues[processedDateValues.length - 1][1]]);

  // Duration per transition
  const duration = 1000; // Duration of transitions in milliseconds

  // 根据调试模式决定动画开始时间
  console.log("数据加载完成");
  console.log("处理后的季度数据:", processedDateValues.length);
  console.log("生成的keyframes:", keyframes.length);
  
  if (DEBUG_MODE) {
    console.log("Debug模式开启 - 立即开始动画");
    updateChart();
  } else {
    console.log("Debug模式关闭 - 15秒后开始动画，请准备录屏");
    setTimeout(() => {
      console.log("开始动画");
      updateChart();
    }, 15000); // 15秒延迟
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
        .attr("y", heightBubble + 70) // 显示在图表下方
        .style("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .style("fill", "black")
        .text(dateString);

      // 按revenue大小排序数据，确保大的圆在后面（不会被小的圆遮住）
      const sortedData = [...data].sort((a, b) => a.revenue - b.revenue);
      
      // Update bubbles - 使用简单的数据绑定，让D3自动处理enter/exit
      bubbles = bubbles.data(sortedData, d => d.company);

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

      // 更新IATA标签 - 使用D3的enter/update/exit模式
      let iataLabels = svgBubble.selectAll(".iata-label")
        .data(sortedData, d => d.company);

      // Handle exits
      iataLabels.exit()
        .transition()
        .duration(200)
        .style("opacity", 0)
        .remove();

      // Handle enters
      const newIataLabels = iataLabels.enter()
        .append("text")
        .attr("class", "iata-label new-label")
        .style("text-anchor", "middle")
        .style("dominant-baseline", "central")
        .style("alignment-baseline", "central")
        .style("font-size", d => Math.max(8, Math.min(18, sizeScaleBubble(d.revenue) * 0.4)) + "px")
        .style("fill", "white")
        .style("font-weight", "bold")
        .style("pointer-events", "none")
        .style("opacity", 0) // 初始透明度为0
        .text(d => d.iata)
        .each(function(d) {
          // 直接设置位置，不使用transition
          d3.select(this)
            .attr("x", xScaleBubble(d.ebitda_margin))
            .attr("y", yScaleBubble(d.revenue_growth));
        });

      // 对新进入的标签进行淡入动画（位置不变）
      newIataLabels.transition()
        .duration(200)
        .style("opacity", d => {
          const baseOpacity = d.opacity !== undefined ? d.opacity : 0.85;
          const overlapOpacity = calculateOverlapOpacity(d, sortedData);
          return Math.min(baseOpacity, overlapOpacity);
        })
        .on("end", function() {
          // 淡入动画完成后，移除new-label类，让标签参与正常的位置更新
          this.classList.remove('new-label');
        });

      // 合并新标签和现有标签
      iataLabels = newIataLabels.merge(iataLabels);

      // 更新所有标签的位置和样式（包括新进入的标签）
      iataLabels.transition()
        .duration(200)
        .attr("x", d => xScaleBubble(d.ebitda_margin))
        .attr("y", d => yScaleBubble(d.revenue_growth))
        .style("font-size", d => Math.max(8, Math.min(18, sizeScaleBubble(d.revenue) * 0.4)) + "px")
        .style("opacity", d => {
          // 计算重叠遮罩效果
          const baseOpacity = d.opacity !== undefined ? d.opacity : 0.85;
          const overlapOpacity = calculateOverlapOpacity(d, sortedData);
          return Math.min(baseOpacity, overlapOpacity);
        })
        .text(d => d.iata); // 确保文字内容也更新

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

      // 添加短暂延迟，让动画更平滑
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  function calculateOverlapOpacity(currentBubble, allBubbles) {
    const currentX = xScaleBubble(currentBubble.ebitda_margin);
    const currentY = yScaleBubble(currentBubble.revenue_growth);
    const currentR = sizeScaleBubble(currentBubble.revenue);
    
    let minOpacity = 0.85;
    
    allBubbles.forEach(otherBubble => {
      if (otherBubble.company === currentBubble.company) return;
      
      const otherX = xScaleBubble(otherBubble.ebitda_margin);
      const otherY = yScaleBubble(otherBubble.revenue_growth);
      const otherR = sizeScaleBubble(otherBubble.revenue);
      
      // 计算距离
      const distance = Math.sqrt((currentX - otherX) ** 2 + (currentY - otherY) ** 2);
      
      // 如果重叠
      if (distance < currentR + otherR) {
        // 如果当前bubble在下方（Y坐标更大）或者被更大的bubble覆盖
        if (currentY > otherY || otherR > currentR) {
          const overlapRatio = Math.max(0, (currentR + otherR - distance) / (currentR + otherR));
          // 根据重叠程度和大小关系调整透明度
          const sizeFactor = otherR > currentR ? 0.7 : 0.5; // 被更大的圆覆盖时透明度降低更多
          minOpacity = Math.min(minOpacity, 0.85 * (1 - overlapRatio * sizeFactor));
        }
      }
    });
    
    return minOpacity;
  }

  function interpolateData(targetQuarterData, sourceQuarterData, t) {
    const interpolatedData = [];
    
    // 创建所有公司的集合
    const allCompanies = new Set([
      ...sourceQuarterData.map(d => d.company),
      ...targetQuarterData.map(d => d.company)
    ]);

    // 获取季度信息用于调试
    const sourceQuarter = sourceQuarterData.length > 0 ? 
      new Date(sourceQuarterData[0].time).getFullYear() + "'Q" + (Math.floor(new Date(sourceQuarterData[0].time).getMonth() / 3) + 1) : "未知";
    const targetQuarter = targetQuarterData.length > 0 ? 
      new Date(targetQuarterData[0].time).getFullYear() + "'Q" + (Math.floor(new Date(targetQuarterData[0].time).getMonth() / 3) + 1) : "未知";

    // 为每个公司计算插值
    allCompanies.forEach(company => {
      const sourceData = sourceQuarterData.find(d => d.company === company);
      const targetData = targetQuarterData.find(d => d.company === company);
      
      if (sourceData && targetData) {
        // 两个季度都有数据：正常插值
        interpolatedData.push({
          company: company,
          iata: targetData.iata,
          ebitda_margin: sourceData.ebitda_margin * (1 - t) + targetData.ebitda_margin * t,
          revenue_growth: sourceData.revenue_growth * (1 - t) + targetData.revenue_growth * t,
          revenue: sourceData.revenue * (1 - t) + targetData.revenue * t,
          region: targetData.region
        });
      } else if (sourceData && !targetData) {
        // 只在源季度有数据：保持原位置
        console.log(`🔴 航空公司 ${company} (${sourceData.iata}) 在 ${sourceQuarter} 有数据，但在 ${targetQuarter} 没有数据 - 保持原位置`);
        interpolatedData.push({
          company: company,
          iata: sourceData.iata,
          ebitda_margin: sourceData.ebitda_margin,
          revenue_growth: sourceData.revenue_growth,
          revenue: sourceData.revenue,
          region: sourceData.region
        });
      } else if (!sourceData && targetData) {
        // 只在目标季度有数据：保持目标位置
        console.log(`🟢 航空公司 ${company} (${targetData.iata}) 在 ${sourceQuarter} 没有数据，但在 ${targetQuarter} 有数据 - 保持目标位置`);
        interpolatedData.push({
          company: company,
          iata: targetData.iata,
          ebitda_margin: targetData.ebitda_margin,
          revenue_growth: targetData.revenue_growth,
          revenue: targetData.revenue,
          region: targetData.region
        });
      }
    });

    return interpolatedData;
  }

});