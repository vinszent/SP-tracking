function GanttCanvas(id) {
    var selfGantt = this;
    var root = document.getElementById(id);
    var ctxt = root.getContext("2d");
    var rows = [];
    var nextInterval = 0;
    var prevInterval = 0;
    this.id = id;
    this.options = {
        padding: 10,
        rowHeight: 20,
        rowSpacing: 10,
        cellSize: 2,
        timeInterval: 200
    };

    // ctxt.font = "30px Arial";

    function layout() {
        var width = 0;
        var height = 0;

        rows.forEach(function(row) {
            height += selfGantt.options.rowHeight;
            width = Math.max(width, row.width);
        });

        width += selfGantt.options.padding*2;
        height += selfGantt.options.padding*2;

        root.width = width;
        root.height = height;
    };

    function draw(timestamp) {
        // console.log(Math.floor((timestamp - prevInterval) / selfGantt.options.timeInterval));

        var ticks = Math.floor((timestamp - prevInterval) / selfGantt.options.timeInterval);

        if (ticks > 0)
        {
            for (var i = 0; i < ticks; i++) {
                rows.forEach(function(row) {
                    row.width += selfGantt.options.cellSize;
                });

                prevInterval = timestamp;

                nextInterval += selfGantt.options.timeInterval;
            }
        }

        rows.forEach(function(row) {
            ctxt.fillText(row.text, 0, row.position*(selfGantt.options.rowHeight +
                                                     selfGantt.options.rowSpacing) +
                          selfGantt.options.rowHeight / 2);

            ctxt.fillStyle = row.colour;
            ctxt.fillRect(row.textWidth, row.position*(selfGantt.options.rowHeight + selfGantt.options.rowSpacing),
                          row.width, selfGantt.options.rowHeight);
            ctxt.fillStyle = "black";

        });
    };

    function render(timestamp) {
        layout();
        draw(timestamp);

        window.requestAnimationFrame(render);
    }

    GanttCanvas.Row = function(position) {
        this.position = position;
        this.width = 0;
        this.textWidth = 0;
        this.text = "";
        this.colour = 'black';

        var selfRow = this;
        var textWidth = 0;

        GanttCanvas.Row.prototype.set_text = function(text) {
            selfRow.text = text;
            selfRow.textWidth = ctxt.measureText(text).width;
            selfRow.width = selfRow.textWidth;
        };

        GanttCanvas.Row.prototype.set_colour = function(colour) {
            selfRow.colour = colour;
        };
    };

    GanttCanvas.prototype.start = function() {
        render(0);
    };

    GanttCanvas.prototype.addRow = function() {
        var row = new GanttCanvas.Row(rows.length);

        rows.push(row);

        layout(this);

        return row;
    };
}
