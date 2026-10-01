CREATE FUNCTION proficiency_rank(value varchar) RETURNS integer AS $$
BEGIN
    RETURN CASE value
        WHEN 'BEGINNER' THEN 1
        WHEN 'INTERMEDIATE' THEN 2
        WHEN 'ADVANCED' THEN 3
        WHEN 'EXPERT' THEN 4
        ELSE 0
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE;

UPDATE atlas_schema_metadata SET schema_version = 14 WHERE id = 1;
