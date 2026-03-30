import { describe, it, expect, vi } from "vitest";
import { ObjectId } from "mongodb";
import { parseObjectIdFromBody } from "./apiRouteHelpers";
import APPLICATION_CONSTANTS from "../application_constants/applicationConstants";

describe("parseObjectIdFromBody", () => {
  it("returns ObjectId for valid hex string", () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const id = new ObjectId();
    const out = parseObjectIdFromBody(
      id.toHexString(),
      res as never,
      APPLICATION_CONSTANTS.NOTEBOOK_ERROR,
    );
    expect(out?.equals(id)).toBe(true);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns null and sends 400 for invalid id", () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const out = parseObjectIdFromBody(
      "not-valid",
      res as never,
      APPLICATION_CONSTANTS.NOTEBOOK_ERROR,
    );
    expect(out).toBeNull();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: APPLICATION_CONSTANTS.NOTEBOOK_ERROR,
    });
  });
});
