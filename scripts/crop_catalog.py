"""
Recorte rápido de paneles blancos en flyers de catálogo El Taller.
Usa proyección horizontal/vertical (sin flood-fill lento).
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image

ASSETS = Path(
    r"C:\Users\Fran\.cursor\projects\c-Users-Fran-Desktop-Pagina-Web-ElTaller\assets"
)
OUT = Path(r"c:\Users\Fran\Desktop\Pagina Web ElTaller\client\img\productos")
OUT.mkdir(parents=True, exist_ok=True)

USER_FILES = [
    "c__Users_Fran_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images__60E485AF-4273-4B6F-9B3D-A288447E39E4_-d912e5dc-cd89-44e2-96c2-0e9090b80504.png",
    "c__Users_Fran_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images__5EA4BD1E-6DF0-4BEE-8D6F-7B5C4ABDB252_-2e9af3e9-4e7b-49f8-a8ed-8f920695f83f.png",
    "c__Users_Fran_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images__33210F58-089C-4269-9F0F-0BA91B816421_-46cbf3aa-fd31-4b90-9008-10c57c4e4752.png",
    "c__Users_Fran_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images__1D4652DB-8AB6-4682-8F8B-C4B20495F999_-cd000b32-eec2-47cc-8b52-7368e0d4390d.png",
    "c__Users_Fran_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images__309E638E-3746-41D7-A948-249721F63E04_-e860ba2e-820d-425f-b19a-b5b3742daec4.png",
    "c__Users_Fran_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images__AF01DE2C-D0BF-4024-A564-7DDCD07F9FD9_-4b6b7493-53c2-4abb-a979-01f3530f71b6.png",
    "c__Users_Fran_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images__7CB429C3-6ADC-4AE9-945E-D8FDB8F0986F_-aff048b5-84bd-4b14-b87a-57e40b49f8b7.png",
    "c__Users_Fran_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images__BC893EC8-A3A0-44E3-9F62-CBC406512DEB_-0ee3cbf3-b243-4909-8be1-e460fcddabe3.png",
    "c__Users_Fran_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images__8B2F5AC7-46D8-48D1-A368-8BA087B1E1A7_-98baed6d-262b-4856-9944-4fade2abb81c.png",
    "c__Users_Fran_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images__79E0EDCB-51DE-4810-AC95-D354D8D71D4D_-dcab9c3d-f4a5-44c9-b210-f59d1cb5b439.png",
    "c__Users_Fran_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images__16498CE0-833C-48AE-941D-7526319850B1_-e2bea51c-5c4d-4e68-a080-a9ade539b027.png",
    "c__Users_Fran_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images__A8F4DA17-BF0E-465F-861A-7BB77F196EAA_-fbf1e7f9-6fda-4e7b-ad4f-342e4055aaef.png",
    "c__Users_Fran_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images__4C3D4794-F775-4746-8096-CFBA7668CA77_-471eda4e-a947-48cb-b65d-fb1b16923309.png",
    "c__Users_Fran_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images__62FB7E6E-C6D2-40F1-85C7-6C2023589CA6_-77d70e37-f6f6-40ab-b1d2-6792d0e09667.png",
    "c__Users_Fran_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images__20281357-A012-4D83-8F19-1753878B339B_-4e44894a-ed56-4081-a0b2-b21c961cd870.png",
    "c__Users_Fran_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images__7BCF15E9-0532-4263-998B-ECB7724B4251_-e909251d-e6e0-47c5-8cce-bcd4270345a1.png",
    "c__Users_Fran_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images__C60CA9B6-5615-458A-B2F8-33ECA04F3E7D_-ab017269-240c-4aaa-89fc-723c6207e993.png",
    "c__Users_Fran_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images__BB64F5F5-D118-4DB3-BABF-7DE75D0E4BFA_-67ce590d-c24f-41f1-a178-62646536bdb3.png",
    "c__Users_Fran_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images__340546BB-DC35-4346-845A-F05F5B9D56F9_-c2e42184-c7b6-47d7-b1b5-45f345cb4672.png",
    "c__Users_Fran_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images__84E27677-7836-446A-84B1-AE31639B9F77_-3cb4bdde-9f45-4064-89ba-09ceac04cc15.png",
    "c__Users_Fran_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images__767D0C09-A91D-4C60-B5C5-5F184CF0CD2E_-322335f8-8267-4d02-a6cd-da7bc97334c4.png",
    "c__Users_Fran_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images__2336A2BD-FFFB-43DD-A95E-84C03EEA7728_-d0ca9567-1221-472e-8535-e4d8c11fe625.png",
    "c__Users_Fran_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images__71E28102-7BF2-493C-9E65-83B3EC6C47F1_-7fcda3dc-8b41-4904-a67c-f859a21c3c87.png",
    "c__Users_Fran_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images__2528A7AD-09E7-4DCC-B2C6-1B84A4CA3A6D_-ad635721-8108-4c60-8656-67c23a76cfd8.png",
    "c__Users_Fran_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images__C07AC71B-53CB-4F69-8D4A-77059DAAD61B_-eda2a9ca-f689-4c14-a3c1-66ef480dddcb.png",
]


def white_mask(rgb: np.ndarray) -> np.ndarray:
    return (rgb[:, :, 0] > 215) & (rgb[:, :, 1] > 215) & (rgb[:, :, 2] > 215)


def spans_from_proj(proj: np.ndarray, thr: float, min_len: int):
    on = proj >= thr
    spans = []
    start = None
    for i, v in enumerate(on):
        if v and start is None:
            start = i
        elif not v and start is not None:
            if i - start >= min_len:
                spans.append((start, i - 1))
            start = None
    if start is not None and len(on) - start >= min_len:
        spans.append((start, len(on) - 1))
    return spans


def find_white_rects(rgb: np.ndarray):
    h, w = rgb.shape[:2]
    m = white_mask(rgb)
    row = m.mean(axis=1)
    col = m.mean(axis=0)
    # filas/cols con bastante blanco = paneles
    yspans = spans_from_proj(row, 0.28, max(40, h // 18))
    xspans = spans_from_proj(col, 0.18, max(40, w // 18))
    rects = []
    for y1, y2 in yspans:
        for x1, x2 in xspans:
            sub = m[y1 : y2 + 1, x1 : x2 + 1]
            fill = float(sub.mean())
            bw, bh = x2 - x1 + 1, y2 - y1 + 1
            area = bw * bh
            if fill < 0.42:
                continue
            if area < 0.03 * w * h or area > 0.65 * w * h:
                continue
            aspect = bw / max(bh, 1)
            if aspect < 0.3 or aspect > 3.0:
                continue
            # margen interno
            pad = int(min(bw, bh) * 0.035)
            rects.append((x1 + pad, y1 + pad, x2 - pad, y2 - pad, area, fill))
    rects.sort(key=lambda r: r[4] * r[5], reverse=True)
    kept = []
    for r in rects:
        x1, y1, x2, y2 = r[:4]
        if x2 - x1 < 60 or y2 - y1 < 60:
            continue
        ok = True
        for k in kept:
            kx1, ky1, kx2, ky2 = k[:4]
            ix1, iy1 = max(x1, kx1), max(y1, ky1)
            ix2, iy2 = min(x2, kx2), min(y2, ky2)
            if ix2 > ix1 and iy2 > iy1:
                inter = (ix2 - ix1) * (iy2 - iy1)
                if inter / ((x2 - x1) * (y2 - y1)) > 0.4:
                    ok = False
                    break
        if ok:
            kept.append(r)
    return kept


def product_canvas(crop: Image.Image) -> Image.Image:
    rgb = np.asarray(crop.convert("RGB"))
    mask = ~white_mask(rgb)
    ys, xs = np.where(mask)
    if len(xs) > 30:
        pad = 20
        x1 = max(0, int(xs.min()) - pad)
        x2 = min(crop.width, int(xs.max()) + pad)
        y1 = max(0, int(ys.min()) - pad)
        y2 = min(crop.height, int(ys.max()) + pad)
        crop = crop.crop((x1, y1, x2, y2))
    tw, th = crop.size
    canvas_w = 600
    canvas_h = 800
    scale = min((canvas_w - 40) / tw, (canvas_h - 40) / th)
    nw, nh = max(1, int(tw * scale)), max(1, int(th * scale))
    resized = crop.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (canvas_w, canvas_h), (255, 255, 255))
    canvas.paste(resized, ((canvas_w - nw) // 2, (canvas_h - nh) // 2))
    return canvas


def main():
    summary = []
    for i, name in enumerate(USER_FILES):
        path = ASSETS / name
        if not path.exists():
            print(f"[{i}] MISSING {name}")
            summary.append({"i": i, "error": "missing", "file": name})
            continue
        img = Image.open(path).convert("RGB")
        # downscale for detection
        max_side = 1200
        scale = 1.0
        if max(img.size) > max_side:
            scale = max_side / max(img.size)
            small = img.resize(
                (int(img.width * scale), int(img.height * scale)), Image.Resampling.BILINEAR
            )
        else:
            small = img
        rects = find_white_rects(np.asarray(small))
        if scale != 1.0:
            rects = [
                (
                    int(x1 / scale),
                    int(y1 / scale),
                    int(x2 / scale),
                    int(y2 / scale),
                    int(area / (scale * scale)),
                    fill,
                )
                for x1, y1, x2, y2, area, fill in rects
            ]
        crops = []
        for j, r in enumerate(rects[:3]):
            x1, y1, x2, y2 = r[:4]
            product = product_canvas(img.crop((x1, y1, x2, y2)))
            out = f"flyer{i:02d}_p{j}.png"
            product.save(OUT / out, "PNG", optimize=True)
            crops.append(out)
        if not crops:
            w, h = img.size
            product = product_canvas(
                img.crop((int(w * 0.05), int(h * 0.15), int(w * 0.75), int(h * 0.95)))
            )
            out = f"flyer{i:02d}_p0.png"
            product.save(OUT / out, "PNG", optimize=True)
            crops.append(out)
        print(f"[{i}] {len(crops)} -> {crops}")
        summary.append({"i": i, "file": name, "crops": crops})

    (OUT / "_crop_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print("DONE", len(summary), "flyers")


if __name__ == "__main__":
    main()
