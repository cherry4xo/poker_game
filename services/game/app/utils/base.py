import json
import copy

def scrub(x):
    # Converts None to empty string
    ret = copy.deepcopy(x)
    # Handle dictionaries, lits & tuples. Scrub all values
    if isinstance(x, dict):
        for k, v in ret.items():
            ret[k] = scrub(v)
    if isinstance(x, (list, tuple)):
        for k, v in enumerate(ret):
            ret[k] = scrub(v)
    # Handle None
    if x is None:
        ret = ''
    # Finished sc
    return json.dumps(ret)