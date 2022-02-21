// credits: AY07

const WIDTH = 900,
    HEIGHT = WIDTH * 0.6;

const margin = {
    top: 70,
    bottom: 70,
    left: 100,
    right: 50
};

const width = WIDTH - margin.left - margin.right,
    height = HEIGHT - margin.top - margin.bottom;

const svg = d3.select("#graph-container")
    .append("svg")
    .attr("width", WIDTH)
    .attr("height", HEIGHT);

const g = svg.append("g")
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

const xAxis = svg.append("g")
    .attr('transform', `translate(${margin.left}, ${margin.top + height})`)

const yAxis = svg.append("g")
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

const colors = ["#fff563", "#81f1f7", "#9dffb0"];

const generarGrafico = (data, hemisphere) => {

    const apilador = d3
        .stack()
        .keys(["Fish", "Insects", "Sea Creatures"]);

    const grouped = d3.group(data, (d) => d.hemisphere)

    const series = apilador(grouped.get(`${hemisphere}`))

    const escalaX = d3
        .scaleTime()
        .domain([new Date("1900-01-01"), new Date("1900-12-01")])
        .range([0, width]);

    const escalaY = d3
        .scaleLinear()
        .domain([0, d3.max(series, (serie) => d3.max(serie, (arreglo) => arreglo[1]))])
        .range([height, 0]);

    xAxis.transition()
        .call(d3.axisBottom(escalaX).tickFormat(d3.timeFormat("%b")));

    yAxis.transition().duration(500)
        .call(d3.axisLeft(escalaY))
        .selectAll("line")
        .attr("x1", width)
        .attr("stroke-dasharray", "5")
        .attr("opacity", 0.5);

    const xAxisLine = svg
        .append("g")
        .append("rect")
        .attr("class", "dotted")
        .attr("stroke-width", "1px")
        .attr("width", "1px")
        .attr("height", height)
        .attr('transform', `translate(${margin.left}, ${margin.top})`)
        .style("opacity", 0);

    const escalaColor = d3
        .scaleOrdinal()
        .domain(series.keys())
        .range(colors.slice(0, series.keys().length));

    d3.selectAll(".bullet-fish").style("color", escalaColor("Fish"));
    d3.selectAll(".bullet-insects").style("color", escalaColor("Insects"));
    d3.selectAll(".bullet-sea-creatures").style("color", escalaColor("Sea Creatures"));

    const area = d3
        .area()
        .curve(d3.curveMonotoneX)
        .x((d) => escalaX(d3.timeParse("%b")(d.data["month"])))
        .y0((d) => escalaY(d[0]))
        .y1((d) => escalaY(d[1]));

    const zeroArea = d3
        .area()
        .curve(d3.curveMonotoneX)
        .x((d) => escalaX(d3.timeParse("%b")(d.data["month"])))
        .y0((d) => escalaY(0))
        .y1((d) => escalaY(0));

    const removeArea = d3
        .area()
        .curve(d3.curveMonotoneX)
        .x((d) => escalaX(d3.timeParse("%b")(d.data["month"])))
        .y0((d) => escalaY(d[0]))
        .y1((d) => escalaY(d[0]));

    // https://vizartpandey.com/line-chart-how-to-show-data-on-mouseover-using-d3-js/

    const listeningRect = svg
        .append("rect")
        .attr("class", "listening-rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "transparent")
        .attr('transform', `translate(${margin.left}, ${margin.top})`)
        .on("mousemove", (event) => mouseMove(event))
        .on("mouseleave", (event) => mouseLeave(event));

    function mouseMove(event) {
        const mousePosition = d3.pointer(event);
        const hoveredDate = escalaX.invert(mousePosition[0]);

        const getDistanceFromHoveredDate = (d) =>
            Math.abs(d3.timeParse("%b")(d.data["month"]) - hoveredDate);

        const closestIndex = d3.leastIndex(series[0], (a, b) =>
            getDistanceFromHoveredDate(a) - getDistanceFromHoveredDate(b));

        //Grab the data point at that index
        const closestDataPoint = series[0][closestIndex];

        const closestXValue = d3.timeParse("%b")(closestDataPoint.data["month"]);

        // Modifying information on tooltip

        tooltip.select("#date").html(d3.timeFormat("%B")(closestXValue))

        tooltip.select("#fish").html(closestDataPoint.data["Fish"]);
        tooltip.select("#insects").html(closestDataPoint.data["Insects"]);
        tooltip.select("#sea-creatures").html(closestDataPoint.data["Sea Creatures"]);

        //Grab the x and y position of our closest point, 
        //shift our tooltip, and hide/show our tooltip appropriately

        const x = escalaX(closestXValue) + margin.left;
        const y = mousePosition[1] + margin.top;

        tooltip.style(
            "transform",
            `translate(` + `calc( -110% + ${x}px),` + `calc(10% + ${y}px)` + `)`
        );

        tooltip.style("opacity", 1);

        // Move xAxisLine to position

        xAxisLine.attr("x", escalaX(closestXValue)).style("opacity", 1);
    };

    function mouseLeave(event) {
        tooltip.style("opacity", 0);
        xAxisLine.style("opacity", 0);
    }

    const tooltip = d3.select("#tooltip");

    g
        .selectAll("path")
        .data(series)
        .join(
            (enter) => {
                enter.append("path")
                    .attr("fill", (serie) => escalaColor(serie.key))
                    .attr("d", (serie) => zeroArea(serie))
                    .transition()
                    .duration(500)
                    .attr("d", (serie) => area(serie))
                    .attr("stroke", "black")
                    .attr("stroke-width", 1)

            },
            (update) => {
                update
                    .transition()
                    .duration(500)
                    .attr("d", (serie) => area(serie))
            },
            (exit) => {
                exit
                    .transition()
                    .duration(500)
                    .attr("d", (serie) => removeArea(serie))
                    .remove();
            }
        )
}

async function initialLoad() {

    const availability = await d3.csv("data/availability.csv", function (d) {
        nuevosDatos = {};
        for (let key in d) {
            if (key == "Hemisphere Month") {
                const info = d[key].split(" ")
                if (info[0] === "SH") {
                    nuevosDatos["hemisphere"] = "SH";
                } else {
                    nuevosDatos["hemisphere"] = "NH"
                }
                nuevosDatos["month"] = info[1];
            } else {
                nuevosDatos[key] = parseInt(d[key]);
            }
        }
        return nuevosDatos;
    })

    generarGrafico(availability, "NH")

    const hemisphereSelector = d3.select("#hemispheres").on('change', onChange);

    function onChange() {
        selectValue = d3.select('select').property('value')
        generarGrafico(availability, selectValue)
    };

};


initialLoad()