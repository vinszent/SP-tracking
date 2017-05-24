// Methods available from outside:
// addComponent(componentId): Adds a component with the given id.
// addLabel(componentId, labelId, labelColor, labelTime): (Adds the component if it does not exist) The first time this function is called on a component it is interpreted as the component entering labelId, and the second time is interpreted as leaving that same labelId.
// reset(): Complete reset.
// start(currentTime): Starts the rendering. This happens automatically once a label has been added.

// canvasId: the id of the HTML canvas.
function GanttCanvas(canvasId) {

    var selfGantt = this;
    
    var canvas = document.getElementById(canvasId);
    
    var ctx = canvas.getContext("2d");
    ctx.textBaseLine = "middle";

    var startTime;
    var parentWidth = document.getElementById('rightside').clientWidth * 0.9;

    var opt = {
        padding: 12,
        textPadding: 3,
        rowHeight: 10,
        rowSpacing: 4,
        defaultTimeInterval: 80,
        timeInterval: 80, // Incremented to fit if schedule goes beyond canvas width
        labelSpacing: 80,
        width: parentWidth
    };

    // Assumes labels are added in chronological order
    function Label(id, color) {
        this.id = id;
        this.color = color;
        this.times = [];
    }

    // Component IDs are assumed to be natural numbers, allowing them to be used as indices
    function Component(id) {
        this.id = id;
        this.labels = [];
        this.cur = 0; // Current label
    }

    var components = [];

    GanttCanvas.prototype.addComponent = function(componentId) {
        if (componentId != parseInt(componentId) || parseInt(componentId) < 0) { // If ID is not a valid index
            return;
        }
        
        if (typeof components[componentId] == "undefined") { // New component
            c = new Component(componentId);
            
            components[componentId] = c;
            
            console.log("Added component %s.", componentId);

        } else {
            console.log("Component %s has already been added.", componentId);
        }
    }

    GanttCanvas.prototype.addLabel = function(componentId, labelId, labelColor, labelIn) {
        if (typeof components[componentId] == "undefined") {
            GanttCanvas.prototype.addComponent(componentId);
        }

        c = components[componentId];

        if (!startTime) {
            GanttCanvas.prototype.start(new Date().getTime());
        }
            
        if (typeof c.labels[c.cur] == "undefined") {
            
            if (labelIn == "true") {
                l = new Label(labelId, labelColor);
                
                l.times[0] = (new Date().getTime());

                c.labels[c.cur] = l;
                
                console.log("Component %s entered %s.", componentId, labelId);                
            }
            
        } else {

            // if (labelIn != "true") { // Assume we are leaving the current label
                c.labels[c.cur].times[1] = new Date().getTime();
                
                console.log("Component %s left %s.", componentId, c.labels[c.cur].id);

                c.cur += 1;
            // }
            
        }
    }

    function layout() {
        var height = 0;

        height += opt.padding*2;
        components.forEach(function(c, i) {
            height += opt.rowHeight + opt.rowSpacing;
        });

        canvas.width = opt.width;
        canvas.height = height;
    };

    function clear() {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    layout();
    clear();

    function draw(timestamp) {
        if (Math.floor((new Date().getTime() - startTime) / opt.timeInterval) >= canvas.width - opt.padding - opt.labelSpacing) {
            squish();
        }
        
        var row = 0;
        
        components.forEach(function(c, i) {
            
            ctx.fillStyle = "black";
            ctx.fillText("Component " + c.id, opt.padding, opt.padding + row*(opt.rowHeight + opt.rowSpacing) + opt.rowHeight/2, opt.labelSpacing);

            c.labels.forEach(function(l, j) {
                
                if (typeof l.times[1] !== "undefined") {
                    ctx.fillStyle = l.color;
                    ctx.fillRect(opt.padding + opt.labelSpacing + Math.floor((l.times[0] - startTime) / opt.timeInterval), opt.padding + row*(opt.rowHeight + opt.rowSpacing), Math.floor((l.times[1] - l.times[0]) / opt.timeInterval) + 1, opt.rowHeight);
                    ctx.fillStyle = "black";
                    ctx.fillText(l.id, opt.padding + opt.labelSpacing + Math.floor((l.times[0] - startTime) / opt.timeInterval) + opt.textPadding, opt.padding + row*(opt.rowHeight + opt.rowSpacing) + opt.rowHeight/2, Math.floor((l.times[1] - l.times[0]) / opt.timeInterval) - opt.textPadding)

                } else {
                    ctx.fillStyle = l.color;
                    ctx.fillRect(opt.padding + opt.labelSpacing + Math.floor((l.times[0] - startTime) / opt.timeInterval), opt.padding + row*(opt.rowHeight + opt.rowSpacing), Math.floor(new Date().getTime() - l.times[0]) / opt.timeInterval, opt.rowHeight);
                    ctx.fillStyle = "black";                    
                    ctx.fillText(l.id, opt.padding + opt.labelSpacing + Math.floor((l.times[0] - startTime) / opt.timeInterval) + opt.textPadding, opt.padding + row*(opt.rowHeight + opt.rowSpacing) + opt.rowHeight/2, Math.floor(new Date().getTime() - l.times[0]) / opt.timeInterval - opt.textPadding);
                }
                
            });
            
            row += 1;
            
        });

        // Start bar
        ctx.fillStyle = "black";
        ctx.fillRect(opt.padding + opt.labelSpacing, 0, 1, ctx.canvas.height);
            
        // The current time bar
        var x = opt.padding + opt.labelSpacing + Math.floor((new Date().getTime() - startTime) / opt.timeInterval);
        ctx.fillRect(x, 0, 3, ctx.canvas.height);
        ctx.fillText(((new Date().getTime() - startTime) / 1000).toFixed(1), x + 5, ctx.canvas.height - 3, ctx.canvas.width - x);
    };

    var requestId;
    var running;
    function render(timestamp) {
        if (running) {   
            layout();
            clear();
            draw(timestamp);

            requestId = window.requestAnimationFrame(render);
        }
    }

    function squish() {
        opt.timeInterval *= 1.5;
    }
    
    GanttCanvas.prototype.reset = function() {
        running = false;
        window.cancelAnimationFrame(requestId);
        startTime = undefined;
        components = [];
        opt.timeInterval = opt.defaultTimeInterval;
        layout();
        clear();
    }

    GanttCanvas.prototype.start = function(currentTime) {
        if (!running) {
            startTime = currentTime;
            running = true;
            render();
        }
    };
}
