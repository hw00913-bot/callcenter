"""Ports on unchanged, actual PlantUML SVG glyph outlines.

No layout, bbox enlargement, SVG mutation, or source/state I/O occurs here.
Coordinates must already share the glyph's SVG coordinate system; this
module does not silently apply transforms, scale strokes or resolve CSS.
``box`` is either {left, top, right, bottom}, SVG {x,y,width,height},
or a (left, top, right, bottom) tuple. Polygon input may be an SVG points
string or a sequence of (x, y) pairs. SVG duplicate/closing vertices are
normalized; non-simple or degenerate outlines fail closed.

For top/bottom, offset is the x displacement from the actual bbox centre;
for left/right, it is the y displacement. Polygon ports come from actual
edge intersections with that vertical/horizontal slice. The extremal
intersection identifies the requested side, but >2 distinct intersections
or an interval of coincident boundary intersections is rejected.
"""

from __future__ import annotations

from dataclasses import dataclass
from math import hypot, isfinite, sqrt
from collections.abc import Mapping, Sequence
import re

PORT_SPACING = 6.0
DEFAULT_TOLERANCE = 1e-7
Point = tuple[float, float]
Box = tuple[float, float, float, float]


class PortError(ValueError):
    """Invalid or unverifiable real-outline port request."""


class PortRangeError(PortError):
    """Offset exceeds the unchanged glyph's actual bbox extent."""


class PortAmbiguityError(PortError):
    """The scan has multiple contour intervals or coincides with an edge."""


class PortCapacityError(PortError):
    """Independent requested ports do not fit the real outline."""


@dataclass(frozen=True)
class PolygonOutline:
    points: tuple[Point, ...]
    box: Box


@dataclass(frozen=True)
class RoundedRectOutline:
    box: Box
    rx: float
    ry: float


Outline = PolygonOutline | RoundedRectOutline


def _number(value: object) -> float:
    try:
        value = float(value)
    except (TypeError, ValueError) as exc:
        raise PortError(f"Not a numeric coordinate: {value!r}") from exc
    if not isfinite(value):
        raise PortError("Coordinates, radii, offsets and spacing must be finite")
    return value


def _point(point: Sequence[float]) -> Point:
    if len(point) != 2:
        raise PortError("A point must contain exactly two coordinates")
    return _number(point[0]), _number(point[1])


def _tolerance(value: float) -> float:
    value = _number(value)
    if value <= 0:
        raise PortError("Tolerance must be positive")
    return value


def _box(box: Mapping[str, float] | Sequence[float]) -> Box:
    if isinstance(box, Mapping):
        if all(k in box for k in ("left", "top", "right", "bottom")):
            result = tuple(_number(box[k]) for k in ("left", "top", "right", "bottom"))
        elif all(k in box for k in ("x", "y", "width", "height")):
            x, y, w, h = (_number(box[k]) for k in ("x", "y", "width", "height"))
            if w <= 0 or h <= 0:
                raise PortError("SVG rect width and height must be positive")
            result = x, y, x + w, y + h
        else:
            raise PortError("Box requires left/top/right/bottom or SVG x/y/width/height")
    else:
        if len(box) != 4:
            raise PortError("Tuple box is (left, top, right, bottom)")
        result = tuple(_number(v) for v in box)
    l, t, r, b = result
    if l >= r or t >= b:
        raise PortError("Outline must have strictly positive width and height")
    return l, t, r, b


def _distance_to_segment(p: Point, a: Point, b: Point) -> float:
    dx, dy = b[0] - a[0], b[1] - a[1]
    length_squared = dx * dx + dy * dy
    if length_squared == 0:
        return hypot(p[0] - a[0], p[1] - a[1])
    u = max(0.0, min(1.0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length_squared))
    return hypot(p[0] - (a[0] + u * dx), p[1] - (a[1] + u * dy))


def _cross(a: Point, b: Point, c: Point) -> float:
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])


def _intersects(a: Point, b: Point, c: Point, d: Point) -> bool:
    # Non-adjacent touches and collinear overlaps also make a polygon invalid.
    if any(_distance_to_segment(p, s, e) <= DEFAULT_TOLERANCE
           for p, s, e in ((a, c, d), (b, c, d), (c, a, b), (d, a, b))):
        return True
    ab_c, ab_d, cd_a, cd_b = _cross(a, b, c), _cross(a, b, d), _cross(c, d, a), _cross(c, d, b)
    return (ab_c < 0 < ab_d or ab_d < 0 < ab_c) and (cd_a < 0 < cd_b or cd_b < 0 < cd_a)


def polygon_outline(points: str | Sequence[Sequence[float]]) -> PolygonOutline:
    """Validate and retain the actual SVG polygon; never fit an ideal diamond."""
    if isinstance(points, str):
        values = [v for v in re.split(r"[\s,]+", points.strip()) if v]
        if len(values) % 2:
            raise PortError("SVG polygon points must contain coordinate pairs")
        raw = [(_number(values[i]), _number(values[i + 1])) for i in range(0, len(values), 2)]
    else:
        raw = [_point(p) for p in points]
    vertices: list[Point] = []
    for p in raw:
        if not vertices or p != vertices[-1]:
            vertices.append(p)
    if len(vertices) > 1 and vertices[-1] == vertices[0]:
        vertices.pop()
    if len(vertices) < 3:
        raise PortError("A polygon needs at least three distinct consecutive vertices")
    n = len(vertices)
    edges = [(vertices[i], vertices[(i + 1) % n]) for i in range(n)]
    for i, (a, b) in enumerate(edges):
        for j in range(i + 1, n):
            if j == i + 1 or (i == 0 and j == n - 1):
                continue
            if _intersects(a, b, *edges[j]):
                raise PortError("Polygon is self-intersecting or has non-adjacent boundary contact")
    area_twice = sum(a[0] * b[1] - b[0] * a[1] for a, b in edges)
    if abs(area_twice) <= DEFAULT_TOLERANCE:
        raise PortError("Polygon has zero area")
    box = (min(p[0] for p in vertices), min(p[1] for p in vertices),
           max(p[0] for p in vertices), max(p[1] for p in vertices))
    return PolygonOutline(tuple(vertices), _box(box))


def rounded_rect_outline(box, rx: float | None, ry: float | None) -> RoundedRectOutline:
    """Apply SVG's actual radius fallback/clamp rules, without changing the bbox."""
    l, t, r, b = _box(box)
    if rx is None and ry is None:
        rx = ry = 0.0
    elif rx is None:
        rx = ry
    elif ry is None:
        ry = rx
    rx, ry = _number(rx), _number(ry)
    if rx < 0 or ry < 0:
        raise PortError("SVG corner radii cannot be negative")
    rx, ry = min(rx, (r - l) / 2), min(ry, (b - t) / 2)
    if rx == 0 or ry == 0:
        rx = ry = 0.0
    return RoundedRectOutline((l, t, r, b), rx, ry)


def _require_outline(outline: Outline) -> None:
    if not isinstance(outline, (PolygonOutline, RoundedRectOutline)):
        raise TypeError("Use polygon_outline(points) or rounded_rect_outline(box, rx, ry)")


def _rect_metric(outline: RoundedRectOutline, p: Point) -> tuple[float, float]:
    l, t, r, b = outline.box
    cx = max(l + outline.rx, min(p[0], r - outline.rx))
    cy = max(t + outline.ry, min(p[1], b - outline.ry))
    dx, dy = p[0] - cx, p[1] - cy
    metric = (dx / outline.rx) ** 2 + (dy / outline.ry) ** 2
    gradient = hypot(2 * dx / outline.rx ** 2, 2 * dy / outline.ry ** 2)
    return metric, gradient


def on_boundary(outline: Outline, point: Sequence[float], *, tolerance=DEFAULT_TOLERANCE) -> bool:
    """Test the real polygon/rounded contour, with spatial numerical tolerance."""
    _require_outline(outline)
    p, tolerance = _point(point), _tolerance(tolerance)
    if isinstance(outline, PolygonOutline):
        return any(_distance_to_segment(p, a, b) <= tolerance
                   for a, b in zip(outline.points, outline.points[1:] + outline.points[:1]))
    l, t, r, b = outline.box
    if not (l - tolerance <= p[0] <= r + tolerance and t - tolerance <= p[1] <= b + tolerance):
        return False
    if outline.rx == 0:
        return min(abs(p[0] - l), abs(p[0] - r), abs(p[1] - t), abs(p[1] - b)) <= tolerance
    metric, gradient = _rect_metric(outline, p)
    return abs(metric - 1.0) <= tolerance * gradient


def outline_contains(outline: Outline, point: Sequence[float], *, include_boundary=True,
                     tolerance=DEFAULT_TOLERANCE) -> bool:
    """Containment on the original contour, including its boundary by default."""
    _require_outline(outline)
    p, tolerance = _point(point), _tolerance(tolerance)
    if on_boundary(outline, p, tolerance=tolerance):
        return bool(include_boundary)
    l, t, r, b = outline.box
    if not (l <= p[0] <= r and t <= p[1] <= b):
        return False
    if isinstance(outline, RoundedRectOutline):
        return outline.rx == 0 or _rect_metric(outline, p)[0] < 1.0
    inside = False
    for a, b in zip(outline.points, outline.points[1:] + outline.points[:1]):
        if (a[1] > p[1]) != (b[1] > p[1]):
            cross_x = a[0] + (p[1] - a[1]) * (b[0] - a[0]) / (b[1] - a[1])
            if p[0] < cross_x:
                inside = not inside
    return inside


def _slice(outline: Outline, side: str, offset: float) -> tuple[int, float]:
    if side not in ("top", "bottom", "left", "right"):
        raise PortError("Side must be top, bottom, left or right")
    offset = _number(offset)
    l, t, r, b = outline.box
    fixed_axis, low, high = (0, l, r) if side in ("top", "bottom") else (1, t, b)
    if not -(high - low) / 2 <= offset <= (high - low) / 2:
        raise PortRangeError(f"Offset {offset:g} exceeds actual {side} span {(high - low):g}")
    return fixed_axis, (low + high) / 2 + offset


def _polygon_port(outline: PolygonOutline, side: str, offset: float, tolerance: float) -> Point:
    fixed_axis, fixed = _slice(outline, side, offset)
    variable_axis = 1 - fixed_axis
    intersections: list[Point] = []
    for a, b in zip(outline.points, outline.points[1:] + outline.points[:1]):
        av, bv = a[fixed_axis], b[fixed_axis]
        if av == bv:
            if abs(fixed - av) <= tolerance:
                raise PortAmbiguityError("Requested polygon slice coincides with an actual outline edge")
            continue
        if not min(av, bv) <= fixed <= max(av, bv):
            continue
        u = (fixed - av) / (bv - av)
        variable = a[variable_axis] + u * (b[variable_axis] - a[variable_axis])
        p = (fixed, variable) if fixed_axis == 0 else (variable, fixed)
        if not any(hypot(p[0] - q[0], p[1] - q[1]) <= tolerance for q in intersections):
            intersections.append(p)
    if not intersections:
        raise PortRangeError("Slice does not meet the actual polygon")
    if len(intersections) > 2:
        raise PortAmbiguityError(f"Polygon slice has {len(intersections)} distinct intersections")
    intersections.sort(key=lambda p: p[variable_axis])
    port = intersections[0] if side in ("top", "left") else intersections[-1]
    if not on_boundary(outline, port, tolerance=tolerance):
        raise PortError("Computed intersection failed the real polygon boundary audit")
    return port


def polygon_port(points, side: str, offset: float, *, tolerance=DEFAULT_TOLERANCE) -> Point:
    """Intersect actual polygon edges; reject off-glyph and ambiguous slices."""
    outline = points if isinstance(points, PolygonOutline) else polygon_outline(points)
    return _polygon_port(outline, side, offset, _tolerance(tolerance))


def _rounded_rect_port(outline: RoundedRectOutline, side: str, offset: float) -> Point:
    fixed_axis, fixed = _slice(outline, side, offset)
    l, t, r, b = outline.box
    rx, ry = outline.rx, outline.ry
    if fixed_axis == 0:
        y_top, y_bottom = t, b
        if rx and (fixed < l + rx or fixed > r - rx):
            cx = l + rx if fixed < l + rx else r - rx
            root = sqrt(max(0.0, 1.0 - ((fixed - cx) / rx) ** 2))
            y_top, y_bottom = t + ry - ry * root, b - ry + ry * root
        return fixed, y_top if side == "top" else y_bottom
    x_left, x_right = l, r
    if ry and (fixed < t + ry or fixed > b - ry):
        cy = t + ry if fixed < t + ry else b - ry
        root = sqrt(max(0.0, 1.0 - ((fixed - cy) / ry) ** 2))
        x_left, x_right = l + rx - rx * root, r - rx + rx * root
    return x_left if side == "left" else x_right, fixed


def rounded_rect_port(box, rx, ry, side: str, offset: float, *, tolerance=DEFAULT_TOLERANCE) -> Point:
    """Use real SVG straight edges and elliptical corner arcs."""
    outline = rounded_rect_outline(box, rx, ry)
    port = _rounded_rect_port(outline, side, offset)
    if not on_boundary(outline, port, tolerance=_tolerance(tolerance)):
        raise PortError("Computed port failed the real rounded-rect boundary audit")
    return port


def port_offsets(count: int, spacing=PORT_SPACING) -> tuple[float, ...]:
    """Centred independent offsets; capacity is checked against the real glyph later."""
    if not isinstance(count, int) or isinstance(count, bool) or count < 1:
        raise PortError("Port count must be a positive integer")
    spacing = _number(spacing)
    if spacing <= 0:
        raise PortError("Port spacing must be positive")
    return tuple((i - (count - 1) / 2) * spacing for i in range(count))


def independent_ports(outline: Outline, side: str, count: int, spacing=PORT_SPACING,
                      *, tolerance=DEFAULT_TOLERANCE) -> tuple[Point, ...]:
    """Generate distinct real-contour ports; never enlarge a glyph to fit demand."""
    _require_outline(outline)
    tolerance = _tolerance(tolerance)
    spacing = _number(spacing)
    try:
        ports = tuple(_polygon_port(outline, side, offset, tolerance)
                      if isinstance(outline, PolygonOutline)
                      else _rounded_rect_port(outline, side, offset)
                      for offset in port_offsets(count, spacing))
    except PortRangeError as exc:
        raise PortCapacityError(f"{count} ports at {spacing:g}px do not fit actual {side} contour") from exc
    for i, p in enumerate(ports):
        if not on_boundary(outline, p, tolerance=tolerance):
            raise PortError("Independent port is off the actual outline")
        if any(hypot(p[0] - q[0], p[1] - q[1]) <= tolerance for q in ports[:i]):
            raise PortCapacityError("Independent ports would share an actual contour point")
    return ports


def _self_test() -> None:
    # Exact original SC-001 PlantUML six-sided wide decision glyph.
    real_points = "4586.734,168.174,4674.734,168.174,4686.734,180.174,4674.734,192.174,4586.734,192.174,4574.734,180.174,4586.734,168.174"
    polygon = polygon_outline(real_points)
    rect_box = {"x": 887.445, "y": 256.174, "width": 182.738, "height": 34.133}
    rect = rounded_rect_outline(rect_box, 12.5, 12.5)
    checks = 0

    def check(value):
        nonlocal checks
        assert value
        checks += 1

    def raises(error, call):
        nonlocal checks
        try:
            call()
        except error:
            checks += 1
            return
        raise AssertionError(f"Expected {error.__name__}")

    for shape in (polygon, rect):
        frozen_box = shape.box
        for side in ("top", "bottom"):
            ports = independent_ports(shape, side, 14)
            check(len(set(ports)) == 14)
            check(all(on_boundary(shape, p) and outline_contains(shape, p) for p in ports))
            check(all(abs(ports[i + 1][0] - ports[i][0] - PORT_SPACING) < 1e-9 for i in range(13)))
            check(shape.box == frozen_box)
        for side in ("left", "right"):
            raises(PortCapacityError, lambda shape=shape, side=side: independent_ports(shape, side, 14))
    check(all(abs(y - 168.174) < 1e-9 for x, y in independent_ports(polygon, "top", 14)))
    # A wide PlantUML decision is not an ideal diamond; its centre top is flat.
    check(polygon_port(real_points, "top", 39)[1] == 168.174)
    check(polygon_port(real_points, "top", 50)[1] > 168.174)
    check(polygon_port(real_points, "left", 0) == (4574.734, 180.174))
    # SVG duplicate corners seen in merge diamonds are accepted.
    diamond = polygon_outline("0,5 0,5 5,0 10,5 5,10 0,5")
    check(polygon_port(diamond, "top", 0) == (5.0, 0.0))
    check(polygon_port(diamond, "right", 0) == (10.0, 5.0))
    check(outline_contains(diamond, (5, 5)))
    check(not outline_contains(diamond, (0, 0)))
    # True elliptical corner and exclusion of its empty bbox corner.
    curved = rounded_rect_outline((0, 0, 100, 40), 20, 10)
    corner_port = rounded_rect_port(curved.box, curved.rx, curved.ry, "top", -45)
    check(corner_port[1] > 0)
    check(on_boundary(curved, corner_port))
    check(not outline_contains(curved, (0, 0)))
    check(not on_boundary(curved, (0, 0)))
    check(rounded_rect_port(curved.box, 20, 10, "left", 0) == (0.0, 20.0))
    check(rounded_rect_outline((0, 0, 100, 40), 80, 80).rx == 50)
    check(rounded_rect_outline((0, 0, 100, 40), 80, 80).ry == 20)
    check(rounded_rect_outline((0, 0, 100, 40), None, 10).rx == 10)
    raises(PortRangeError, lambda: polygon_port(polygon, "top", 56.000001))
    raises(PortRangeError, lambda: rounded_rect_port((0, 0, 100, 40), 20, 10, "left", 20.000001))
    raises(PortError, lambda: rounded_rect_port((0, 0, 100, 40), -1, 2, "top", 0))
    raises(PortError, lambda: polygon_port(polygon, "unknown", 0))
    raises(PortError, lambda: polygon_port(polygon, "top", float("nan")))
    raises(PortError, lambda: polygon_outline("0,0 10,10 0,10 10,0"))
    # Two disjoint slice intervals of a simple C polygon are ambiguous.
    concave = polygon_outline([(0, 0), (10, 0), (10, 2), (2, 2), (2, 8), (10, 8), (10, 10), (0, 10)])
    raises(PortAmbiguityError, lambda: polygon_port(concave, "top", 0))
    square = polygon_outline([(0, 0), (10, 0), (10, 10), (0, 10)])
    raises(PortAmbiguityError, lambda: polygon_port(square, "top", -5))
    tiny = polygon_outline([(0, 12), (12, 0), (24, 12), (12, 24)])
    raises(PortCapacityError, lambda: independent_ports(tiny, "top", 14))
    check(port_offsets(14) == tuple(range(-39, 40, 6)))
    print(f"PASS {checks} geometry checks; unchanged real PlantUML glyphs each have 14 independent top/bottom ports at 6px; insufficient spans rejected")


if __name__ == "__main__":
    _self_test()
