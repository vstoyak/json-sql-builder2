'use strict';

class and extends SQLBuilder.SQLHelper {
	constructor(sql){
		super(sql);

		this.Types({
			Array: {
				eachItemOf: {
					String: { syntax: this.Syntax('<value>[  AND ... ]') },
					Object: { syntax: this.Syntax('<key-ident> <value>[  AND ... ]') },
					Function: { syntax: this.Syntax('<value>[  AND ... ]') }
				}
			}
		});
	}

	preBuild(query) {
		// query is always an Array
		this.forEach(query, (obj)=>{
			if(this.isPlainObject(obj)) {
				this.forEach(obj, (value, key) => {
					// check for Primitiv value
					// like : { first_name: 'Jane' } or { age: 18 }
					// this will be a shortcut for
					// { first_name: { $eq: 'Jane' } } or { age: { $eq: 18 } }
					if (this.isIdentifier(key) && this.isPrimitive(value)) {
						obj[key] = { $eq: value };
					}
				});
			}
		});

		return query;
	}

	postBuild(result) {
		let isCurrentTillWhere = (name) => {
			for (var i=this._helperChain.length-2/*ignore the current one*/; i >= 0; i--){
				// stop at any "where"
				if (this._helperChain[i] == '$where') return false;

				if (this._helperChain[i] == name) {
					return true;
				}
			}
			return false;
		}

		if (isCurrentTillWhere('$and') || isCurrentTillWhere('$or')) {
			result = '(' + result + ')';
		}
		return result;
	}
}

module.exports = {
	definition: and,
	description: 'Specifies the logical `AND` Operator as Helper.',
	supportedBy: {
		MySQL: 'https://dev.mysql.com/doc/refman/5.7/en/logical-operators.html#operator_and',
		MariaDB: 'https://mariadb.com/kb/en/library/and/',
		PostgreSQL: 'https://www.postgresql.org/docs/9.5/static/functions-logical.html',
		SQLite: 'https://sqlite.org/lang_expr.html',
		Oracle: 'https://docs.oracle.com/cd/B13789_01/server.101/b10759/conditions004.htm',
		SQLServer: 'https://docs.microsoft.com/en-US/sql/t-sql/language-elements/and-transact-sql'
	},
	examples: {
		Array: {
			eachItemOf: {
				Object: {
					"Basic Usage": function(sql) {
						return {
							test: function(){
								return sql.build({
									$select: {
										$from: 'people',
										$where: {
											$and: [
												{ first_name: { $eq: 'Jane' } },
												{ last_name: { $eq: 'Doe' } }
											]
										}
									}
								});
							},
							expectedResults: {
								sql: 'SELECT * FROM people WHERE first_name = $1 AND last_name = $2',
								values: {
									$1: 'Jane',
									$2: 'Doe'
								}
							}
						}
					}
				},
				String: {
					"Basic Usage": function(sql) {
						return {
							test: function(){
								return sql.build({
									$select: {
										$from: 'people',
										$where: {
											$and: [
												"COALESCE(gender, 'male') = 'male'",
												{ last_name: { $eq: 'Doe' } }
											]
										}
									}
								});
							},
							expectedResults: {
								sql: "SELECT * FROM people WHERE COALESCE(gender, 'male') = 'male' AND last_name = $1",
								values: {
									$1: 'Doe'
								}
							}
						}
					}
				},
				Function: {
					"Basic Usage": function(sql) {
						return {
							test: function(){
								return sql.build({
									$select: {
										$from: 'people',
										$where: {
											$and: [
												sql.cmp('~~first_name', '=', 'Jane'),
												{ last_name: { $eq: 'Doe' } }
											]
										}
									}
								});
							},
							expectedResults: {
								sql: "SELECT * FROM people WHERE first_name = $1 AND last_name = $2",
								values: {
									$1: 'Jane',
									$2: 'Doe'
								}
							}
						}
					}
				}
			}
		}
	}
}
