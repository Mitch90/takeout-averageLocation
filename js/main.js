//tool per caricare il proprio json, calcola il range nel dataset e fa vedere dati

//time formatter and parser
var formatDate = d3.timeFormat("%B %d, %Y"),
    formatMonth = d3.timeFormat("%m"),
    formatDay = d3.timeFormat("%d"),
    formatHour = d3.timeFormat("%H"),
    formatMinute = d3.timeFormat("%M");

var margin = {
        top: 50,
        right: 0,
        bottom: 100,
        left: 30
    },
    width = 1200 - margin.left - margin.right,
    height = 720 - margin.top - margin.bottom,
    gridSize = Math.floor(width / 32),
    legendElementWidth = gridSize * 2,
    buckets = 9,
    // colors = ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"],
    // colors = ["#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#bd0026", "#800026"],
    // colors = ["#e5e1e1", "#e7ccc6", "#e8b7ad", "#e9a395", "#ea8f80", "#eb7b6d", "#eb655b", "#ec4b4a", "#ed283b"],
    // colors = ["#e5e1e1", "#e9debe", "#eddb9a", "#f1d875", "#f4d646", "#f1b046", "#ef8b43", "#ed633f", "#ed283b"],
    colors = ["#e6f1f3", "#dee2ed", "#d6d5e7", "#cfc8e1", "#c8bbdc", "#d59ca9", "#de7e7f", "#e55b5c", "#ed283b"],
    // colors = ["#e6f1f3", "#e9efcc", "#ececa4", "#eeeb7b", "#efe943", "#eebe45", "#ec9443", "#ec6940", "#ed283b"],
    months = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"],
    days = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"];

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + (margin.left + 50) + "," + margin.top + ")");

var monthLabels = svg.selectAll(".monthLabel")
    .data(months)
    .enter().append("text")
    .text(function(d) {
        return d;
    })
    .attr("x", 0)
    .attr("y", function(d, i) {
        return i * gridSize;
    })
    .style("text-anchor", "end")
    .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
    .attr("class", "monthLabel mono axis");

var dayLabels = svg.selectAll(".dayLabel")
    .data(days)
    .enter().append("text")
    .text(function(d) {
        return d;
    })
    .attr("x", function(d, i) {
        return i * gridSize;
    })
    .attr("y", 0)
    .style("text-anchor", "middle")
    .attr("transform", "translate(" + gridSize / 2 + ", -6)")
    .attr("class", "dayLabel mono axis");

var x = d3.scaleLinear().range([0, width]).domain([0, 31]),
    y = d3.scaleLinear().range([height, 0]).domain([0, 13]),
    z = d3.scaleSqrt().range([2, 50]);

d3.json("data/Takeout/LocationHistory/LocationHistory_Thesis.min.json", function(error, data) {
    if (error) throw error;

    //remap data to prepare it for aggregation
    var dataPoints = data.locations.map(function(d) {
        var timestamp = d.time,
            date = formatDate(timestamp),
            month = formatMonth(timestamp),
            day = formatDay(timestamp),
            hour = formatHour(timestamp),
            minute = formatMinute(timestamp);

        return {
            date: date,
            month: month,
            day: day,
            hour: hour,
            min: minute,
            timestamp: timestamp
        };
    });

    //aggregate by day and add statistics with rollup method
    var pointsByDay = d3.nest()
        .key(function(d) {
            return d.date;
        })
        .rollup(function(v) {
            return {
                count: +v.length,
                month: +v[0].month,
                day: +v[0].day
            };
        })
        .entries(dataPoints);

    console.log(pointsByDay);

    console.log(d3.extent(pointsByDay, function(d) {
        return d.value.count;
    }));

    z.domain(d3.extent(pointsByDay, function(d) {
        return d.value.count;
    }));

    var colorScale = d3.scaleQuantile()
        // .domain([0, buckets - 1, d3.max(pointsByDay, function(d) {
        //     return d.value.count;
        // })])
        .domain(d3.extent(pointsByDay, function(d) {
            return d.value.count;
        }))
        .range(colors);

    var cards = svg.selectAll(".dayCard")
        .data(pointsByDay, function(d) {
            return d.value.month + ':' + d.value.day;
        });

    cards.append("title");

    cards.enter().append("rect")
        .attr("x", function(d) {
            return (d.value.day - 1) * gridSize;
        })
        .attr("y", function(d) {
            return (d.value.month - 1) * gridSize;
        })
        .attr("rx", 2)
        .attr("ry", 2)
        .attr("class", "dayCard bordered")
        .attr("width", gridSize)
        .attr("height", gridSize)
        .style("fill", function(d) {
            return colorScale(d.value.count);
        });

    cards.select("title").text(function(d) {
        return d.value.count;
    });

    cards.exit().remove();

    var legend = svg.selectAll(".legend")
        .data([0].concat(colorScale.quantiles()), function(d) {
            return d;
        }).enter().append("g")
        .attr("class", "legend");

    legend.append("rect")
        .attr("x", function(d, i) {
            return legendElementWidth * i;
        })
        .attr("y", height)
        .attr("width", legendElementWidth)
        .attr("height", gridSize / 2)
        .style("fill", function(d, i) {
            return colors[i];
        });

    legend.append("text")
        .attr("class", "mono")
        .text(function(d) {
            return "≥ " + Math.round(d);
        })
        .attr("x", function(d, i) {
            return legendElementWidth * i;
        })
        .attr("y", height + gridSize);

    legend.exit().remove();
    // svg.append("g")
    //     .attr("class", "axis axis--x")
    //     .attr("transform", "translate(0," + height + ")")
    //     .call(d3.axisBottom(x));
    //
    // svg.append("g")
    //     .attr("class", "axis axis--y")
    //     .call(d3.axisLeft(y));
    //
    // svg.selectAll(".dot")
    //     .data(pointsByDay)
    //     .enter().append("circle")
    //     .attr("class", "dot")
    //     .attr("r", function(d) {
    //         return z(d.value.count);
    //     })
    //     .attr("cx", function(d) {
    //         return x(d.value.day);
    //     })
    //     .attr("cy", function(d) {
    //         return y(d.value.month);
    //     })
    //     .style("fill", function(d) {
    //         return "blue";
    //     })
    //     .style("opacity", function(d) {
    //         return 0.4;
    //     });

});
