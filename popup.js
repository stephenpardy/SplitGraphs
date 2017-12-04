// Update the relevant fields with the new data
var expenses_ = null;

function setDOMInfo(expenses) {

  function custom_bisect(data, test){
    break_point = 0;
    flag = 1;
    data.forEach(function(d, i){
      if (flag && test > d.date) {
        break_point = i;
        flag = 0;
      }
    });
    return break_point;
  };

  var parseDate = d3.time.format("%Y-%m-%dT%H:%M:%SZ").parse;
  var formatDate = d3.time.format("%b %d");

  expenses.forEach(function(d){
      d.date = parseDate(d.date);
  });

  var margin = {
        top: 20,
        right: 200,
        bottom: 50,
        left: 50
      },
      width = 600 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom,
      x = d3.time.scale().range([0, width])
                              .domain(d3.extent(expenses, function(d){
                                  return d.date;
                              })),
      y = d3.scale.linear().range([height, 0])
                                .domain(d3.extent(expenses, function(d){
                                  return d.cumulativeOwe;
                                })),
      xAxis = d3.svg.axis()
        .scale(x)
        .tickSize(5)
        .tickSubdivide(true),
      yAxis = d3.svg.axis()
        .scale(y)
        .tickSize(5)
        .orient('left')
        .tickSubdivide(true);

  //var bisectDate = d3.bisector(function(d) { return d.date; }).left;
  console.log(expenses);
  expenses_ = expenses;
  var svg = d3.select("#balanceChart").append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append('g')
              .attr('transform', "translate(" + margin.left + "," + margin.top + ")");

  svg.append('svg:g')
    .attr('class', 'xaxis axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis);

  svg.append('svg:g')
    .attr('class', 'yaxis axis')
    .call(yAxis);

    var lineFunc = d3.svg.line()
    .x(function(d) {
      return x(d.date);
    })
    .y(function(d) {
      return y(d.cumulativeOwe);
    })
    .interpolate('linear');

    var areaFunc = d3.svg.area()
    .interpolate("linear")
    .x(function(d) {
      return x(d.date);
    })
    .y0(y(0))
    .y1(function(d) {
      return y(d.cumulativeOwe);
    });

  //  x0 = x.invert(142);
  //  i = bisectDate(expenses, x0)
  //  console.log(x0, i, custom_bisect(expenses, x0));

    svg.datum(expenses);

    svg.append("clipPath")
        .attr("id", "clip-below")
      .append("path")
        .attr("d", areaFunc.y0(height));

    svg.append("clipPath")
        .attr("id", "clip-above")
      .append("path")
        .attr("d", areaFunc.y0(0));

    svg.append("path")
        .attr("class", "area above")
        .attr("clip-path", "url(#clip-above)")
        .attr("d", areaFunc.y0(function(d) { return y(0); }));

    svg.append("path")
        .attr("class", "area below")
        .attr("clip-path", "url(#clip-below)")
        .attr("d", areaFunc);

    svg.append("path")
        .attr("class", "line")
        .attr("d", lineFunc);

  svg.selectAll(".xaxis text")  // select all the text elements for the xaxis
    .attr("transform", function(d) {
       return "translate(" + this.getBBox().height*-2 + "," + this.getBBox().height + ")rotate(-45)";
   });

  // now add titles to the axes
  svg.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "translate("+ (-margin.left/1.5) +","+(height/2)+")rotate(-90)")
      .text("Balance");

  svg.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "translate("+ (width/2) +","+(height+(margin.bottom))+")")
      .text("Date");

  var focus = svg.append("g")
                 .attr("class", "focus")
                 .style("display", "none");

  focus.append("circle")
       .attr("r", 4.5);

  focus.append("text")
       .attr("class", "owed")
       .text("Amount = ")
       .style('font-size', '17px')
       .attr("x", 0)
       .attr("dx", '0.5em')
       .attr("dy", '0.35em');

  svg.append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height)
      .attr("opacity", 0)
      .on("mouseover", function() { focus.style("display", null);})
      .on("mouseout", function() { focus.style("display", "none");})
      .on("mousemove", mousemove);

    function mousemove() {

      var x0 = x.invert(d3.mouse(this)[0]),
          i = custom_bisect(expenses, x0),
          d0 = expenses[i - 1],
          d1 = expenses[i];
       //This is janky for some reason -- to few points?
      //var d = (x0 - d0.date) > (d1.date - x0) ? d1 : d0;
      var d = (x0 >= d1.date) ? d1 : d0;
      focus.attr('transform', 'translate(' + x(d.date) + "," + y(d.cumulativeOwe) + ")");
      if (d.cumulativeOwe > 0){
        focus.select("text.owed").text("You were owed = $" + Math.abs((d.cumulativeOwe)).toFixed(2) +
                                        "\non " + formatDate(d.date));
      } else {
        focus.select("text.owed").text("You owed = $"+Math.abs((d.cumulativeOwe)).toFixed(2) +
                                        "\non " + formatDate(d.date));
      }
    };

};  // end of setDOMinfo


// Once the DOM is ready...
window.addEventListener('DOMContentLoaded', function () {
  // ...query for the active tab...
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function (tabs) {
    // ...and send a request for the DOM info...
    chrome.tabs.sendMessage(
        tabs[0].id,
        {from: 'popup', subject: 'DOMInfo'},
        // ...also specifying a callback to be called 
        //    from the receiving end (content script)
        setDOMInfo);
  });
});