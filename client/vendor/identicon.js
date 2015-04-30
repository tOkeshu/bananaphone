var Identicon;
(function (Identicon) {
    function hex(buffer) {
        var codes = [];
        var view = new Uint32Array(buffer);
        for (var i = 0; i < view.length; i += 1) {
            codes.push(view[i].toString(16));
        }
        return codes.join("");
    }
    function sha256(data) {
        var buffer = new window.TextEncoder("utf-8").encode(data);
        return window.crypto.subtle.digest("SHA-256", buffer).then(function (hash) {
            return hex(hash);
        });
    }
    var Generator = (function () {
        function Generator() {
        }
        Generator.prototype.render = function (canvas, id) {
            this.patchSize = canvas.width / 3;
            return sha256(id).then(function (hash) {
                var parameters = this._hashToParameters(hash);
                this._render(canvas, parameters);
                return canvas;
            }.bind(this));
        };
        Generator.prototype._hashToParameters = function (hash) {
            return {
                // Only the first four are nice for the center patch
                center: parseInt(hash[0], 16) % 4,
                side: parseInt(hash[1], 16),
                corner: parseInt(hash[2], 16),
                centerInvert: !(parseInt(hash[3], 16) % 2),
                sideInvert: !(parseInt(hash[4], 16) % 2),
                cornerInvert: !(parseInt(hash[5], 16) % 2),
                sideRotation: parseInt(hash[6], 16) % 4,
                cornerRotation: parseInt(hash[7], 16) % 4,
                color: "#" + hash.slice(8, 8 + 6)
            };
        };
        Generator.prototype._render = function (canvas, parameters) {
            var ctx = canvas.getContext('2d');
            ctx.save();
            // center patch
            this._drawPatch(ctx, {
                x: this.patchSize,
                y: this.patchSize,
                patch: parameters.center,
                color: parameters.color,
                invert: parameters.centerInvert,
                rotation: 0 // no rotation
            });
            // sides
            [[1, 0], [2, 1], [1, 2], [0, 1]].forEach(function (coordinates, r) {
                var x = coordinates[0] * this.patchSize;
                var y = coordinates[1] * this.patchSize;
                this._drawPatch(ctx, {
                    x: x,
                    y: y,
                    patch: parameters.side,
                    color: parameters.color,
                    invert: parameters.sideInvert,
                    rotation: (parameters.sideRotation + r) % 4
                });
            }.bind(this));
            // corners
            [[0, 0], [2, 0], [2, 2], [0, 2]].forEach(function (coordinates, r) {
                var x = coordinates[0] * this.patchSize;
                var y = coordinates[1] * this.patchSize;
                this._drawPatch(ctx, {
                    x: x,
                    y: y,
                    patch: parameters.corner,
                    color: parameters.color,
                    invert: parameters.cornerInvert,
                    rotation: (parameters.cornerRotation + r) % 4
                });
            }.bind(this));
            ctx.restore();
        };
        Generator.prototype._drawPatch = function (ctx, options) {
            var patch = Generator.patches[options.patch];
            var vertices = this._scale(this._rotate(patch, options.rotation), this.patchSize);
            var white = "#fff";
            var first = vertices.shift();
            ctx.save();
            ctx.translate(options.x, options.y);
            // Background
            ctx.fillStyle = options.invert ? options.color : white;
            ctx.fillRect(0, 0, this.patchSize, this.patchSize);
            // Draw the Patch
            ctx.fillStyle = options.invert ? white : options.color;
            ctx.beginPath();
            ctx.moveTo(first[0], first[1]);
            vertices.forEach(function (vertex) {
                ctx.lineTo(vertex[0], vertex[1]);
            });
            ctx.fill();
            // Pop the translation
            ctx.restore();
        };
        Generator.prototype._rotate = function (vertices, rotation) {
            return vertices.map(function (vertex) {
                var x = vertex[0];
                var y = vertex[1];
                var oldx;
                for (var r = rotation; r > 0; r -= 1) {
                    oldx = x;
                    x = 4 - y;
                    y = oldx;
                }
                return [x, y];
            });
        };
        Generator.prototype._scale = function (vertices, size) {
            var size = this.patchSize;
            return vertices.map(function (vertex) {
                return [vertex[0] * (size / 4), vertex[1] * (size / 4)];
            });
        };
        Generator.patches = [
            // The first four ones are nice for the center patch
            // (do not change their order)
            [[0, 0], [4, 0], [4, 4], [0, 4]],
            [[2, 0], [4, 2], [2, 4], [0, 2]],
            [[1, 1], [3, 1], [3, 3], [1, 3]],
            [[0, 0], [4, 0], [4, 4], [0, 4]],
            [[2, 0], [4, 4], [0, 4]],
            [[0, 0], [4, 0], [0, 4]],
            [[0, 0], [4, 2], [2, 4]],
            [[0, 0], [2, 0], [0, 2]],
            [[4, 4], [0, 4], [0, 2]],
            [[0, 2], [4, 2], [2, 4]],
            [[0, 2], [2, 0], [2, 2]],
            [[0, 0], [2, 0], [2, 4], [0, 4]],
            [[0, 0], [4, 2], [4, 4], [2, 4]],
            [[0, 0], [2, 0], [2, 2], [0, 2]],
            [[0, 4], [2, 2], [4, 4], [0, 4]],
            [[2, 0], [4, 4], [2, 4], [3, 2], [1, 2], [2, 4], [0, 4]]
        ];
        return Generator;
    })();
    function render(canvas, id) {
        return new Generator().render(canvas, id);
    }
    Identicon.render = render;
})(Identicon || (Identicon = {}));
//# sourceMappingURL=identicon.js.map