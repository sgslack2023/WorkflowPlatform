import duckdb
import pandas as pd
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from django.db import connections

class BaseTransform(ABC):
    """
    Abstract Base Class for all Data Transformations using DuckDB.
    """
    key: str = ""
    name: str = ""
    description: str = ""
    input_schema: Dict[str, Any] = {}
    output_schema: Dict[str, Any] = {}

    @abstractmethod
    def execute(self, inputs: List[pd.DataFrame], params: Dict[str, Any]) -> pd.DataFrame:
        """
        Executes the transformation.
        """
        pass

    def run_query(self, query: str, context: Dict[str, pd.DataFrame]) -> pd.DataFrame:
        """
        Helper to run DuckDB SQL queries against multiple DataFrames.
        """
        con = duckdb.connect(database=':memory:')
        # Register inputs as tables in DuckDB
        for name, df in context.items():
            con.register(name, df)
        
        result_df = con.execute(query).df()
        return result_df
